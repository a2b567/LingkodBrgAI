package handlers

import (
	"net/http"
	"time"

	"backend/internal/config"
	"backend/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type HealthHandler struct{}

// GET /api/health-records
func (h *HealthHandler) ListRecords(c *gin.Context) {
	var records []models.HealthRecord
	if err := config.DB.Preload("DispensedItems").Order("created_at desc").Find(&records).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch health records"})
		return
	}
	c.JSON(http.StatusOK, records)
}

// POST /api/health-records
func (h *HealthHandler) CreateRecord(c *gin.Context) {
	var req struct {
		ResidentName string `json:"resident_name" binding:"required"`
		Age          int    `json:"age"`
		BloodType    string `json:"blood_type"`
		Allergies    string `json:"allergies"`
		Conditions   string `json:"conditions"`
		LastCheckup  string `json:"last_checkup"`
		Status       string `json:"status"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.BloodType == "" {
		req.BloodType = "O+"
	}
	if req.Status == "" {
		req.Status = "Healthy"
	}
	if req.LastCheckup == "" {
		req.LastCheckup = time.Now().Format("2006-01-02")
	}

	record := models.HealthRecord{
		ResidentName: req.ResidentName,
		Age:          req.Age,
		BloodType:    req.BloodType,
		Allergies:    req.Allergies,
		Conditions:   req.Conditions,
		LastCheckup:  req.LastCheckup,
		Status:       req.Status,
	}

	if err := config.DB.Create(&record).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create health record"})
		return
	}

	c.JSON(http.StatusCreated, record)
}

// DELETE /api/health-records/:id
func (h *HealthHandler) DeleteRecord(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid UUID"})
		return
	}

	if err := config.DB.Delete(&models.HealthRecord{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete health record"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Health record deleted successfully"})
}

// POST /api/health-records/:id/dispense
func (h *HealthHandler) DispenseMedicine(c *gin.Context) {
	idStr := c.Param("id")
	recordID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid UUID"})
		return
	}

	var req struct {
		MedicineName string `json:"medicineName" binding:"required"`
		Quantity     int    `json:"quantity" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 1. Check stock
	var stock models.MedicineStock
	if err := config.DB.Where("name = ?", req.MedicineName).First(&stock).Error; err == nil {
		if stock.Stock < req.Quantity {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient stock"})
			return
		}
		// Deduct stock
		config.DB.Model(&stock).Update("stock", stock.Stock-req.Quantity)
	}

	// 2. Create dispensed item record
	dispensed := models.DispensedItem{
		HealthRecordID: recordID,
		MedicineName:   req.MedicineName,
		Quantity:       req.Quantity,
		Date:           time.Now().Format("2006-01-02"),
	}

	if err := config.DB.Create(&dispensed).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to record dispensing"})
		return
	}

	c.JSON(http.StatusOK, dispensed)
}

// GET /api/medicine-stock
func (h *HealthHandler) ListStock(c *gin.Context) {
	var stock []models.MedicineStock
	if err := config.DB.Order("name asc").Find(&stock).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch stock"})
		return
	}
	c.JSON(http.StatusOK, stock)
}

// POST /api/medicine-stock
func (h *HealthHandler) AddStock(c *gin.Context) {
	var req struct {
		Name     string `json:"name" binding:"required"`
		Category string `json:"category"`
		Quantity int    `json:"quantity"`
		Unit     string `json:"unit"`
		MinStock int    `json:"minStock"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Unit == "" {
		req.Unit = "tablets"
	}
	if req.MinStock <= 0 {
		req.MinStock = 10
	}

	stock := models.MedicineStock{
		Name:     req.Name,
		Category: req.Category,
		Stock:    req.Quantity,
		Unit:     req.Unit,
		MinStock: req.MinStock,
	}

	if err := config.DB.Create(&stock).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add medicine stock"})
		return
	}

	c.JSON(http.StatusCreated, stock)
}

// PUT /api/medicine-stock/:id/restock
func (h *HealthHandler) Restock(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid UUID"})
		return
	}

	var req struct {
		Quantity int `json:"quantity" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var stock models.MedicineStock
	if err := config.DB.First(&stock, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Medicine stock item not found"})
		return
	}

	newQty := stock.Stock + req.Quantity
	if err := config.DB.Model(&stock).Update("stock", newQty).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to restock"})
		return
	}

	stock.Stock = newQty
	c.JSON(http.StatusOK, stock)
}

// DELETE /api/medicine-stock/:id
func (h *HealthHandler) DeleteStock(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid UUID"})
		return
	}

	if err := config.DB.Delete(&models.MedicineStock{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete medicine stock"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Medicine deleted successfully"})
}
