package handlers

import (
	"net/http"
	"time"

	"backend/internal/config"
	"backend/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AppointmentHandler struct{}

func (h *AppointmentHandler) List(c *gin.Context) {
	db := config.DB
	var appointments []models.Appointment

	dateStr := c.Query("date")
	status := c.Query("status")

	query := db.Preload("Resident")

	// Limit residents to viewing their own appointments
	userRole, _ := c.Get("role")
	if userRole == "Resident" {
		resIDVal, exists := c.Get("residentID")
		if exists {
			query = query.Where("resident_id = ?", resIDVal)
		} else {
			c.JSON(http.StatusOK, []models.Appointment{})
			return
		}
	}

	if dateStr != "" {
		if t, err := time.Parse("2006-01-02", dateStr); err == nil {
			// Query specific day matching Year, Month, Day
			query = query.Where("DATE(appointment_date) = DATE(?)", t)
		}
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Order("appointment_date asc, queue_number asc").Find(&appointments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch appointments"})
		return
	}

	c.JSON(http.StatusOK, appointments)
}

func (h *AppointmentHandler) Book(c *gin.Context) {
	var req struct {
		ResidentID      uuid.UUID `json:"resident_id" binding:"required"`
		Purpose         string    `json:"purpose" binding:"required"`
		AppointmentDate string    `json:"appointment_date" binding:"required"` // YYYY-MM-DD
		TimeSlot        string    `json:"time_slot" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	appDate, err := time.Parse("2006-01-02", req.AppointmentDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD"})
		return
	}

	db := config.DB

	// Count appointments for that day to allocate queue number
	var dailyCount int64
	db.Model(&models.Appointment{}).Where("DATE(appointment_date) = DATE(?)", appDate).Count(&dailyCount)
	queueNum := int(dailyCount) + 1

	appointment := models.Appointment{
		ResidentID:      req.ResidentID,
		Purpose:         req.Purpose,
		AppointmentDate: appDate,
		TimeSlot:        req.TimeSlot,
		Status:          "Pending",
		QueueNumber:     queueNum,
	}
	appointment.ID = uuid.New()

	if err := db.Create(&appointment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to book appointment"})
		return
	}

	c.JSON(http.StatusCreated, appointment)
}

func (h *AppointmentHandler) UpdateStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"` // Confirmed, Completed, Cancelled
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB
	var app models.Appointment
	if err := db.First(&app, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Appointment not found"})
		return
	}

	app.Status = req.Status
	if err := db.Save(&app).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update appointment"})
		return
	}

	c.JSON(http.StatusOK, app)
}

func (h *AppointmentHandler) PredictCongestion(c *gin.Context) {
	db := config.DB
	
	// Check next 7 days congestion rates
	type CongestionReport struct {
		Date           string `json:"date"`
		BookingsCount  int64  `json:"bookings_count"`
		CongestionRisk string `json:"congestion_risk"` // Low, Medium, High
	}

	var report []CongestionReport
	now := time.Now()

	for i := 0; i < 7; i++ {
		targetDate := now.AddDate(0, 0, i)
		dateStr := targetDate.Format("2006-01-02")
		
		var count int64
		db.Model(&models.Appointment{}).Where("DATE(appointment_date) = DATE(?)", targetDate).Count(&count)

		risk := "Low"
		if count > 20 {
			risk = "High"
		} else if count > 8 {
			risk = "Medium"
		}

		report = append(report, CongestionReport{
			Date:           dateStr,
			BookingsCount:  count,
			CongestionRisk: risk,
		})
	}

	c.JSON(http.StatusOK, report)
}
