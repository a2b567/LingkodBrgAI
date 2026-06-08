package handlers

import (
	"crypto/sha256"
	"fmt"
	"net/http"
	"strings"
	"time"

	"backend/internal/config"
	"backend/internal/models"
	"backend/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CertificateHandler struct {
	pdfService services.PDFService
}

func (h *CertificateHandler) List(c *gin.Context) {
	db := config.DB
	var certificates []models.Certificate

	status := c.Query("status")
	certType := c.Query("type")
	residentIDStr := c.Query("resident_id")

	query := db.Preload("Resident")

	// Regular residents can only see their own requests
	userRole, _ := c.Get("role")
	if userRole == "Resident" {
		resIDVal, exists := c.Get("residentID")
		if exists {
			query = query.Where("resident_id = ?", resIDVal)
		} else {
			c.JSON(http.StatusOK, []models.Certificate{})
			return
		}
	} else if residentIDStr != "" {
		if rID, err := uuid.Parse(residentIDStr); err == nil {
			query = query.Where("resident_id = ?", rID)
		}
	}

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if certType != "" {
		query = query.Where("type = ?", certType)
	}

	if err := query.Order("created_at desc").Find(&certificates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch certificates"})
		return
	}

	c.JSON(http.StatusOK, certificates)
}

func (h *CertificateHandler) Get(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	db := config.DB
	var cert models.Certificate
	if err := db.Preload("Resident").First(&cert, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Certificate not found"})
		return
	}

	c.JSON(http.StatusOK, cert)
}

func (h *CertificateHandler) Request(c *gin.Context) {
	var req struct {
		ResidentID uuid.UUID `json:"resident_id" binding:"required"`
		Type       string    `json:"type" binding:"required"` // Clearance, Indigency, Residency, Business, Cedula
		Purpose    string    `json:"purpose" binding:"required"`
		Fee        float64   `json:"fee"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB
	var resident models.Resident
	if err := db.First(&resident, "id = ?", req.ResidentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Resident not found"})
		return
	}

	// Generate clean document metadata
	var count int64
	db.Model(&models.Certificate{}).Count(&count)
	docNo := fmt.Sprintf("DOC-2026-%04d", count+1)
	
	// Create hash for QR verification
	hashingSource := fmt.Sprintf("%s-%s-%s-%d", docNo, req.Type, req.ResidentID, time.Now().UnixNano())
	hashBytes := sha256.Sum256([]byte(hashingSource))
	qrHash := fmt.Sprintf("%x", hashBytes)[:24]

	cert := models.Certificate{
		ResidentID:     req.ResidentID,
		Type:           req.Type,
		DocumentNumber: docNo,
		Status:         "Pending",
		Purpose:        req.Purpose,
		QRHash:         qrHash,
		Fee:            req.Fee,
		PaymentStatus:  "Unpaid",
		RequestDate:    time.Now(),
	}

	// Default pricing if missing
	if cert.Fee == 0 {
		switch cert.Type {
		case "Clearance":
			cert.Fee = 150.00
		case "Indigency":
			cert.Fee = 0.00
			cert.PaymentStatus = "Paid" // Indigency is free
		case "Residency":
			cert.Fee = 100.00
		case "Business":
			cert.Fee = 300.00
		case "Cedula":
			cert.Fee = 50.00
		}
	}

	if err := db.Create(&cert).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to request certificate"})
		return
	}

	// Log audit log
	userIDVal, _ := c.Get("userID")
	var logUserID *uuid.UUID
	if userIDVal != nil {
		uid := userIDVal.(uuid.UUID)
		logUserID = &uid
	}
	db.Create(&models.AuditLog{
		UserID:    logUserID,
		Action:    "REQUEST_DOCUMENT",
		Details:   fmt.Sprintf("Requested %s (%s) for resident %s", cert.Type, cert.DocumentNumber, resident.LastName),
		IPAddress: c.ClientIP(),
	})

	c.JSON(http.StatusCreated, cert)
}

func (h *CertificateHandler) Approve(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	db := config.DB
	var cert models.Certificate
	if err := db.Preload("Resident").First(&cert, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Certificate request not found"})
		return
	}

	now := time.Now()
	cert.Status = "Issued"
	cert.IssueDate = &now
	cert.PaymentStatus = "Paid" // Mark as paid upon issuance

	// Compile PDF
	pdfPath, err := h.pdfService.GenerateCertificate(cert)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to generate PDF: %v", err)})
		return
	}
	cert.PDFPath = pdfPath

	tx := db.Begin()
	if err := tx.Save(&cert).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to approve certificate"})
		return
	}

	// Create payment entry if fee > 0
	if cert.Fee > 0 {
		payment := models.Payment{
			ReferenceNumber: "PAY-" + strings.ReplaceAll(uuid.New().String()[:8], "-", ""),
			Purpose:         cert.Type + " Fee - " + cert.DocumentNumber,
			Amount:          cert.Fee,
			Status:          "Paid",
			PayorName:       cert.Resident.FirstName + " " + cert.Resident.LastName,
			CertificateID:   &cert.ID,
			TransactionDate: now,
		}
		if err := tx.Create(&payment).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to record payment"})
			return
		}
	}

	tx.Commit()

	// Log Audit
	userIDVal, _ := c.Get("userID")
	var logUserID *uuid.UUID
	if userIDVal != nil {
		uid := userIDVal.(uuid.UUID)
		logUserID = &uid
	}
	db.Create(&models.AuditLog{
		UserID:    logUserID,
		Action:    "APPROVE_DOCUMENT",
		Details:   fmt.Sprintf("Approved and generated %s (%s) for resident %s", cert.Type, cert.DocumentNumber, cert.Resident.LastName),
		IPAddress: c.ClientIP(),
	})

	c.JSON(http.StatusOK, cert)
}

func (h *CertificateHandler) Reject(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	db := config.DB
	var cert models.Certificate
	if err := db.First(&cert, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Certificate not found"})
		return
	}

	cert.Status = "Rejected"
	if err := db.Save(&cert).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reject certificate"})
		return
	}

	c.JSON(http.StatusOK, cert)
}

func (h *CertificateHandler) PublicRequest(c *gin.Context) {
	var req struct {
		FirstName string  `json:"first_name" binding:"required"`
		LastName  string  `json:"last_name" binding:"required"`
		Type      string  `json:"type" binding:"required"`
		Purpose   string  `json:"purpose" binding:"required"`
		Fee       float64 `json:"fee"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB
	var resident models.Resident
	if err := db.Where("LOWER(first_name) = LOWER(?) AND LOWER(last_name) = LOWER(?)", req.FirstName, req.LastName).First(&resident).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No matching resident record found. Please ensure your name is registered at the barangay hall."})
		return
	}

	var count int64
	db.Model(&models.Certificate{}).Count(&count)
	docNo := fmt.Sprintf("DOC-2026-%04d", count+1)
	
	hashingSource := fmt.Sprintf("%s-%s-%s-%d", docNo, req.Type, resident.ID, time.Now().UnixNano())
	hashBytes := sha256.Sum256([]byte(hashingSource))
	qrHash := fmt.Sprintf("%x", hashBytes)[:24]

	cert := models.Certificate{
		ResidentID:     resident.ID,
		Type:           req.Type,
		DocumentNumber: docNo,
		Status:         "Pending",
		Purpose:        req.Purpose,
		QRHash:         qrHash,
		Fee:            req.Fee,
		PaymentStatus:  "Unpaid",
		RequestDate:    time.Now(),
	}

	if cert.Fee == 0 {
		switch cert.Type {
		case "Clearance":
			cert.Fee = 150.00
		case "Indigency":
			cert.Fee = 0.00
			cert.PaymentStatus = "Paid"
		case "Residency":
			cert.Fee = 100.00
		case "Business":
			cert.Fee = 300.00
		case "Cedula":
			cert.Fee = 50.00
		}
	}

	if err := db.Create(&cert).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to request certificate"})
		return
	}

	db.Create(&models.AuditLog{
		Action:    "PUBLIC_REQUEST_DOCUMENT",
		Details:   fmt.Sprintf("Public Kiosk Requested %s (%s) for resident %s", cert.Type, cert.DocumentNumber, resident.LastName),
		IPAddress: c.ClientIP(),
	})

	c.JSON(http.StatusCreated, cert)
}

func (h *CertificateHandler) VerifyQR(c *gin.Context) {
	hash := c.Param("hash")

	db := config.DB
	var cert models.Certificate
	if err := db.Preload("Resident").Where("qr_hash = ?", hash).First(&cert).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"valid":   false,
			"message": "Verification failed. Invalid QR code hash or document not found.",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"valid":     true,
		"message":   "Document is authentic and issued by Barangay Lawrence.",
		"document":  cert.DocumentNumber,
		"type":      cert.Type,
		"recipient": cert.Resident.FirstName + " " + cert.Resident.LastName,
		"issued_on": cert.IssueDate,
		"purpose":   cert.Purpose,
	})
}
