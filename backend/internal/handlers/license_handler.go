package handlers

import (
	"net/http"
	"time"

	"backend/internal/config"
	"backend/internal/models"
	"backend/internal/services"
	"github.com/gin-gonic/gin"
)

type LicenseHandler struct {
	service services.LicenseService
}

type ValidateLicenseRequest struct {
	LicenseKey string `json:"license_key" binding:"required"`
	HardwareID string `json:"hardware_id"`
}

type GenerateLicenseRequest struct {
	CustomerName  string     `json:"customer_name" binding:"required"`
	CustomerEmail string     `json:"customer_email" binding:"required"`
	MaxUsers      int        `json:"max_users"`
	IsPerpetual   bool       `json:"is_perpetual"`
	ExpiryDate    *time.Time `json:"expiry_date"`
}

type ActivateLicenseRequest struct {
	LicenseKey string `json:"license_key" binding:"required"`
	HardwareID string `json:"hardware_id"`
}

// Validate handles POST /api/licenses/validate
func (h *LicenseHandler) Validate(c *gin.Context) {
	var req ValidateLicenseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"valid":   false,
			"message": "Invalid request payload. 'license_key' is required.",
			"error":   err.Error(),
		})
		return
	}

	lic, valid, message := h.service.ValidateLicense(req.LicenseKey, req.HardwareID)
	if !valid {
		c.JSON(http.StatusOK, gin.H{
			"valid":   false,
			"message": message,
			"license": lic,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"valid":   true,
		"message": message,
		"license": lic,
	})
}

// Generate handles POST /api/licenses/generate (Admin/Staff only)
func (h *LicenseHandler) Generate(c *gin.Context) {
	var req GenerateLicenseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	lic, err := h.service.CreateLicense(
		req.CustomerName,
		req.CustomerEmail,
		req.MaxUsers,
		req.ExpiryDate,
		req.IsPerpetual,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "License key generated successfully!",
		"license": lic,
	})
}

// Activate handles POST /api/licenses/activate
func (h *LicenseHandler) Activate(c *gin.Context) {
	var req ActivateLicenseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "license_key is required."})
		return
	}

	lic, valid, message := h.service.ValidateLicense(req.LicenseKey, req.HardwareID)
	if !valid {
		c.JSON(http.StatusBadRequest, gin.H{
			"activated": false,
			"message":   message,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"activated": true,
		"message":   "System license activated successfully!",
		"license":   lic,
	})
}

// Status handles GET /api/licenses/status
func (h *LicenseHandler) Status(c *gin.Context) {
	db := config.DB
	var lic models.License
	if err := db.Where("is_active = ?", true).Order("created_at desc").First(&lic).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{
			"is_activated": false,
			"message":      "No active license registered. Please activate a license key.",
		})
		return
	}

	now := time.Now()
	isExpired := !lic.IsPerpetual && lic.ExpiryDate != nil && now.After(*lic.ExpiryDate)

	c.JSON(http.StatusOK, gin.H{
		"is_activated": true,
		"is_expired":   isExpired,
		"license":      lic,
	})
}
