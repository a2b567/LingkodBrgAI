package handlers

import (
	"net/http"

	"backend/internal/config"
	"backend/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type HouseholdHandler struct{}

func (h *HouseholdHandler) List(c *gin.Context) {
	db := config.DB
	var households []models.Household

	poverty := c.Query("poverty_level")
	address := c.Query("address")

	query := db.Preload("Head").Preload("Members")

	if poverty != "" {
		query = query.Where("poverty_level = ?", poverty)
	}
	if address != "" {
		query = query.Where("LOWER(address) LIKE ?", "%"+address+"%")
	}

	if err := query.Find(&households).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch households"})
		return
	}

	c.JSON(http.StatusOK, households)
}

func (h *HouseholdHandler) Get(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Household ID"})
		return
	}

	db := config.DB
	var household models.Household
	if err := db.Preload("Head").Preload("Members").First(&household, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Household not found"})
		return
	}

	c.JSON(http.StatusOK, household)
}

func (h *HouseholdHandler) Create(c *gin.Context) {
	var household models.Household
	if err := c.ShouldBindJSON(&household); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB
	household.ID = uuid.New()

	if err := db.Create(&household).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create household"})
		return
	}

	c.JSON(http.StatusCreated, household)
}

func (h *HouseholdHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Household ID"})
		return
	}

	db := config.DB
	var household models.Household
	if err := db.First(&household, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Household not found"})
		return
	}

	if err := c.ShouldBindJSON(&household); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	household.ID = id
	if err := db.Save(&household).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update household"})
		return
	}

	c.JSON(http.StatusOK, household)
}

func (h *HouseholdHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Household ID"})
		return
	}

	db := config.DB
	tx := db.Begin()

	// Clear household link for all members
	if err := tx.Model(&models.Resident{}).Where("household_id = ?", id).Update("household_id", nil).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unlink household members"})
		return
	}

	if err := tx.Delete(&models.Household{}, "id = ?", id).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete household record"})
		return
	}

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "Household deleted successfully"})
}

func (h *HouseholdHandler) AssignMember(c *gin.Context) {
	var req struct {
		HouseholdID uuid.UUID `json:"household_id" binding:"required"`
		ResidentID  uuid.UUID `json:"resident_id" binding:"required"`
		IsHead      bool      `json:"is_head"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB
	tx := db.Begin()

	// Assign resident to household
	if err := tx.Model(&models.Resident{}).Where("id = ?", req.ResidentID).Updates(map[string]interface{}{
		"household_id":      req.HouseholdID,
		"is_household_head": req.IsHead,
	}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign resident"})
		return
	}

	// If marked as head, update household head pointer and reset others in the same household
	if req.IsHead {
		if err := tx.Model(&models.Resident{}).Where("household_id = ? AND id != ?", req.HouseholdID, req.ResidentID).Update("is_household_head", false).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reset old heads"})
			return
		}

		if err := tx.Model(&models.Household{}).Where("id = ?", req.HouseholdID).Update("head_id", req.ResidentID).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update household head reference"})
			return
		}
	}

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "Member assigned successfully"})
}
