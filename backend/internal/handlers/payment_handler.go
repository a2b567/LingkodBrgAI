package handlers

import (
	"net/http"

	"backend/internal/config"
	"backend/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type PaymentHandler struct{}

func (h *PaymentHandler) List(c *gin.Context) {
	db := config.DB
	var payments []models.Payment

	status := c.Query("status")
	payor := c.Query("payor")

	query := db.Model(&models.Payment{})

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if payor != "" {
		query = query.Where("LOWER(payor_name) LIKE ?", "%"+payor+"%")
	}

	if err := query.Order("transaction_date desc").Find(&payments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch payments"})
		return
	}

	c.JSON(http.StatusOK, payments)
}

func (h *PaymentHandler) Get(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	db := config.DB
	var payment models.Payment
	if err := db.First(&payment, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment record not found"})
		return
	}

	c.JSON(http.StatusOK, payment)
}
