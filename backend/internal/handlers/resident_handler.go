package handlers

import (
	"encoding/csv"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"backend/internal/config"
	"backend/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/skip2/go-qrcode"
)

type ResidentHandler struct{}

func (h *ResidentHandler) List(c *gin.Context) {
	db := config.DB
	var residents []models.Resident

	// Query params
	search := c.Query("search")
	gender := c.Query("gender")
	voterStatus := c.Query("voter_status")
	residencyStatus := c.Query("residency_status")
	exportCSV := c.Query("export") == "csv"

	query := db.Model(&models.Resident{})

	if search != "" {
		s := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(first_name) LIKE ? OR LOWER(last_name) LIKE ? OR LOWER(address) LIKE ? OR qr_id LIKE ?", s, s, s, s)
	}
	if gender != "" {
		query = query.Where("gender = ?", gender)
	}
	if voterStatus != "" {
		query = query.Where("voter_status = ?", voterStatus)
	}
	if residencyStatus != "" {
		query = query.Where("residency_status = ?", residencyStatus)
	}

	// Pagination if not exporting
	if !exportCSV {
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
		offset := (page - 1) * limit

		var total int64
		query.Count(&total)

		if err := query.Order("last_name asc, first_name asc").Limit(limit).Offset(offset).Find(&residents).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch residents"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"data":  residents,
			"total": total,
			"page":  page,
			"limit": limit,
		})
		return
	}

	// CSV Export Flow
	if err := query.Order("last_name asc, first_name asc").Find(&residents).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch residents for export"})
		return
	}

	c.Header("Content-Disposition", "attachment; filename=residents.csv")
	c.Header("Content-Type", "text/csv")
	writer := csv.NewWriter(c.Writer)

	writer.Write([]string{"QR ID", "First Name", "Middle Name", "Last Name", "Birthdate", "Gender", "Civil Status", "Address", "Contact Number", "Email", "Voter Status", "Residency Status"})
	for _, r := range residents {
		writer.Write([]string{
			r.QRID,
			r.FirstName,
			r.MiddleName,
			r.LastName,
			r.Birthdate.Format("2006-01-02"),
			r.Gender,
			r.CivilStatus,
			r.Address,
			r.ContactNumber,
			r.Email,
			r.VoterStatus,
			r.ResidencyStatus,
		})
	}
	writer.Flush()
}

func (h *ResidentHandler) Get(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Resident ID"})
		return
	}

	db := config.DB
	var resident models.Resident
	if err := db.First(&resident, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Resident not found"})
		return
	}

	c.JSON(http.StatusOK, resident)
}

func (h *ResidentHandler) Create(c *gin.Context) {
	var resident models.Resident
	if err := c.ShouldBindJSON(&resident); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB
	resident.ID = uuid.New()
	resident.QRID = "QR-RES-" + strings.ReplaceAll(uuid.New().String()[:8], "-", "")

	// Generate QR Code containing the Resident details endpoint
	qrData := fmt.Sprintf("http://localhost:5173/verify/resident/%s", resident.ID)
	uploadsDir := "./uploads/qr"
	os.MkdirAll(uploadsDir, os.ModePerm)
	qrFilePath := filepath.Join(uploadsDir, fmt.Sprintf("%s.png", resident.ID))
	
	if err := qrcode.WriteFile(qrData, qrcode.Medium, 256, qrFilePath); err == nil {
		// Save absolute link or relative path to view QR
		// We'll store it as a file path or handle serving it
	}

	if err := db.Create(&resident).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save resident"})
		return
	}

	c.JSON(http.StatusCreated, resident)
}

func (h *ResidentHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Resident ID"})
		return
	}

	db := config.DB
	var resident models.Resident
	if err := db.First(&resident, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Resident not found"})
		return
	}

	if err := c.ShouldBindJSON(&resident); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resident.ID = id // Keep ID immutable
	if err := db.Save(&resident).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update resident"})
		return
	}

	c.JSON(http.StatusOK, resident)
}

func (h *ResidentHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Resident ID"})
		return
	}

	db := config.DB
	if err := db.Delete(&models.Resident{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete resident"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Resident deleted successfully"})
}

func (h *ResidentHandler) UploadPhoto(c *gin.Context) {
	file, header, err := c.Request.FormFile("photo")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File parsing error"})
		return
	}
	defer file.Close()

	uploadsDir := "./uploads/photos"
	os.MkdirAll(uploadsDir, os.ModePerm)

	ext := filepath.Ext(header.Filename)
	filename := fmt.Sprintf("%s%s", uuid.New().String(), ext)
	filePath := filepath.Join(uploadsDir, filename)

	out, err := os.Create(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create target upload file"})
		return
	}
	defer out.Close()

	_, err = io.Copy(out, file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error copying data stream"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"photo_url": "/uploads/photos/" + filename})
}
