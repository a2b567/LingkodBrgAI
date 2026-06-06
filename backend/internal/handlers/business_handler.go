package handlers

import (
	"fmt"
	"net/http"
	"time"

	"backend/internal/config"
	"backend/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type BusinessHandler struct{}

func (h *BusinessHandler) List(c *gin.Context) {
	db := config.DB
	var businesses []models.Business

	status := c.Query("status")
	search := c.Query("search")

	query := db.Preload("Owner")

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if search != "" {
		s := "%" + search + "%"
		query = query.Where("business_name LIKE ? OR permit_number LIKE ?", s, s)
	}

	if err := query.Find(&businesses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch businesses"})
		return
	}

	c.JSON(http.StatusOK, businesses)
}

func (h *BusinessHandler) Get(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	db := config.DB
	var biz models.Business
	if err := db.Preload("Owner").First(&biz, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Business not found"})
		return
	}

	c.JSON(http.StatusOK, biz)
}

func (h *BusinessHandler) Create(c *gin.Context) {
	var biz models.Business
	if err := c.ShouldBindJSON(&biz); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB

	// Generate Permit number
	var count int64
	db.Model(&models.Business{}).Count(&count)
	biz.PermitNumber = fmt.Sprintf("BUS-2026-%04d", count+1)
	biz.ID = uuid.New()
	biz.RegistrationDate = time.Now()
	biz.ExpiryDate = time.Now().AddDate(1, 0, 0) // Valid for 1 year

	if err := db.Create(&biz).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register business"})
		return
	}

	c.JSON(http.StatusCreated, biz)
}

func (h *BusinessHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	db := config.DB
	var biz models.Business
	if err := db.First(&biz, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Business not found"})
		return
	}

	if err := c.ShouldBindJSON(&biz); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	biz.ID = id
	if err := db.Save(&biz).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update business details"})
		return
	}

	c.JSON(http.StatusOK, biz)
}

func (h *BusinessHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	db := config.DB
	if err := db.Delete(&models.Business{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete business permit"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Business deleted successfully"})
}
