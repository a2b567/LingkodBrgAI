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

type BlotterHandler struct{}

func (h *BlotterHandler) List(c *gin.Context) {
	db := config.DB
	var cases []models.Blotter

	search := c.Query("search")
	status := c.Query("status")

	query := db.Model(&models.Blotter{})

	if search != "" {
		s := "%" + search + "%"
		query = query.Where("case_number LIKE ? OR complainant LIKE ? OR respondent LIKE ? OR details LIKE ?", s, s, s, s)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Order("filing_date desc").Find(&cases).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch cases"})
		return
	}

	c.JSON(http.StatusOK, cases)
}

func (h *BlotterHandler) Get(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	db := config.DB
	var kase models.Blotter
	if err := db.First(&kase, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Case record not found"})
		return
	}

	c.JSON(http.StatusOK, kase)
}

func (h *BlotterHandler) Create(c *gin.Context) {
	var kase models.Blotter
	if err := c.ShouldBindJSON(&kase); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB

	// Auto case number
	var count int64
	db.Model(&models.Blotter{}).Count(&count)
	kase.CaseNumber = fmt.Sprintf("CASE-2026-%04d", count+1)
	kase.FilingDate = time.Now()
	kase.ID = uuid.New()
	if kase.HearingSchedules == "" {
		kase.HearingSchedules = "[]"
	}

	// Trigger manual fallback for summary if AI is not connected yet
	if kase.AISummary == "" {
		kase.AISummary = fmt.Sprintf("Complainant: %s. Respondent: %s. Filing date: %s. Incident Details: %s", 
			kase.Complainant, kase.Respondent, kase.FilingDate.Format("Jan 02, 2006"), kase.Details)
	}

	if err := db.Create(&kase).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to record case"})
		return
	}

	c.JSON(http.StatusCreated, kase)
}

func (h *BlotterHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	db := config.DB
	var kase models.Blotter
	if err := db.First(&kase, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Case not found"})
		return
	}

	if err := c.ShouldBindJSON(&kase); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	kase.ID = id
	if err := db.Save(&kase).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update case file"})
		return
	}

	c.JSON(http.StatusOK, kase)
}

func (h *BlotterHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	db := config.DB
	if err := db.Delete(&models.Blotter{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete case"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Case deleted successfully"})
}
