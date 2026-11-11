package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"backend/internal/config"
	"backend/internal/models"
	"github.com/gin-gonic/gin"
)

type SettingsHandler struct{}

type HotlineItem struct {
	ID     string `json:"id"`
	Title  string `json:"title"`
	Number string `json:"number"`
	Desc   string `json:"desc"`
	Color  string `json:"color,omitempty"`
}

var defaultEmergencyHotlines = []HotlineItem{
	{ID: "1", Title: "Emergency Response (National 911)", Number: "911", Desc: "Police, Medical & Rescue", Color: "bg-rose-500"},
	{ID: "2", Title: "Barangay San Isidro Main Hall", Number: "(049) 501-2749", Desc: "Barangay Desk & Security", Color: "bg-blue-600"},
	{ID: "3", Title: "Barangay Health Center / RHU", Number: "(049) 501-2750", Desc: "Doctor, Nurse & Ambulance", Color: "bg-emerald-600"},
	{ID: "4", Title: "PNP Local Police Station", Number: "(049) 501-1122", Desc: "Patrol & Law Enforcement", Color: "bg-indigo-600"},
	{ID: "5", Title: "BFP Bureau of Fire Protection", Number: "(049) 501-3473", Desc: "Fire Rescue & Disaster Unit", Color: "bg-amber-600"},
}

// GetHotlines returns the official barangay emergency hotlines
func (h *SettingsHandler) GetHotlines(c *gin.Context) {
	db := config.DB
	if db == nil {
		c.JSON(http.StatusOK, gin.H{"data": defaultEmergencyHotlines})
		return
	}

	var setting models.SystemSetting
	if err := db.First(&setting, "key = ?", "emergency_hotlines").Error; err != nil {
		// Not yet configured; return defaults
		c.JSON(http.StatusOK, gin.H{"data": defaultEmergencyHotlines})
		return
	}

	var items []HotlineItem
	if err := json.Unmarshal([]byte(setting.Value), &items); err != nil || len(items) == 0 {
		c.JSON(http.StatusOK, gin.H{"data": defaultEmergencyHotlines})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": items})
}

// UpdateHotlines allows the Barangay Captain or Admin to edit the real contact numbers
func (h *SettingsHandler) UpdateHotlines(c *gin.Context) {
	db := config.DB
	if db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database unavailable"})
		return
	}

	var req struct {
		Hotlines []HotlineItem `json:"hotlines" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload format: hotlines list is required"})
		return
	}

	dataBytes, err := json.Marshal(req.Hotlines)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to serialize hotlines"})
		return
	}

	setting := models.SystemSetting{
		Key:       "emergency_hotlines",
		Value:     string(dataBytes),
		UpdatedAt: time.Now(),
	}

	// Upsert setting
	var existing models.SystemSetting
	if err := db.First(&existing, "key = ?", "emergency_hotlines").Error; err != nil {
		if createErr := db.Create(&setting).Error; createErr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save emergency hotlines"})
			return
		}
	} else {
		existing.Value = setting.Value
		existing.UpdatedAt = setting.UpdatedAt
		if saveErr := db.Save(&existing).Error; saveErr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update emergency hotlines"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Matagumpay na na-update ang mga Emergency SOS Hotlines!",
		"data":    req.Hotlines,
	})
}

var DefaultCertFees = map[string]float64{
	"Clearance":    150.00,
	"Indigency":    0.00,
	"Residency":    100.00,
	"Business":     300.00,
	"Cedula":       50.00,
	"Barangay ID":  100.00,
}

// GetFeeScheduleFromDB retrieves the active fee schedule from DB or fallback
func GetFeeScheduleFromDB() map[string]float64 {
	fees := make(map[string]float64)
	for k, v := range DefaultCertFees {
		fees[k] = v
	}

	db := config.DB
	if db == nil {
		return fees
	}

	var setting models.SystemSetting
	if err := db.First(&setting, "key = ?", "cert_fees").Error; err == nil && setting.Value != "" {
		var custom map[string]float64
		if err := json.Unmarshal([]byte(setting.Value), &custom); err == nil {
			for k, v := range custom {
				fees[k] = v
			}
		}
	}
	return fees
}

// GetFees returns the official certificate & permit fee schedule
func (h *SettingsHandler) GetFees(c *gin.Context) {
	fees := GetFeeScheduleFromDB()
	c.JSON(http.StatusOK, gin.H{
		"data": fees,
	})
}

// UpdateFees updates the official certificate fee schedule across the barangay
func (h *SettingsHandler) UpdateFees(c *gin.Context) {
	db := config.DB
	if db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database unavailable"})
		return
	}

	var req struct {
		Fees map[string]float64 `json:"fees" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid fee schedule format"})
		return
	}

	merged := GetFeeScheduleFromDB()
	for k, v := range req.Fees {
		if v < 0 {
			v = 0
		}
		merged[k] = v
	}

	// Indigency must remain 0 by welfare mandate
	merged["Indigency"] = 0.00

	dataBytes, err := json.Marshal(merged)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to serialize fee schedule"})
		return
	}

	setting := models.SystemSetting{
		Key:       "cert_fees",
		Value:     string(dataBytes),
		UpdatedAt: time.Now(),
	}

	var existing models.SystemSetting
	if err := db.First(&existing, "key = ?", "cert_fees").Error; err != nil {
		if createErr := db.Create(&setting).Error; createErr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save fee schedule"})
			return
		}
	} else {
		existing.Value = setting.Value
		existing.UpdatedAt = setting.UpdatedAt
		if saveErr := db.Save(&existing).Error; saveErr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update fee schedule"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Matagumpay na na-update ang Certificate & Permit Fee Schedule sa buong barangay!",
		"data":    merged,
	})
}

type ClinicSchedule struct {
	IsOpen                bool   `json:"is_open"`
	ScheduleDays          string `json:"schedule_days"`
	OperatingHours        string `json:"operating_hours"`
	NurseOnDuty           string `json:"nurse_on_duty"`
	Advisory              string `json:"advisory"`
	AllowQueueWhileClosed bool   `json:"allow_queue_while_closed"`
	UpdatedAt             string `json:"updated_at,omitempty"`
	UpdatedBy             string `json:"updated_by,omitempty"`
}

var DefaultClinicSchedule = ClinicSchedule{
	IsOpen:                true,
	ScheduleDays:          "Lunes hanggang Biyernes (Mon - Fri)",
	OperatingHours:        "8:00 AM - 5:00 PM",
	NurseOnDuty:           "Barangay Health Worker / Duty Nurse",
	Advisory:              "Bukas ang clinic para sa regular checkup, pagpapabakuna, at libreng gamot. Para sa agarang medical emergency, tumawag sa RHU o 911.",
	AllowQueueWhileClosed: false,
}

func GetClinicScheduleFromDB() ClinicSchedule {
	sched := DefaultClinicSchedule
	db := config.DB
	if db == nil {
		return sched
	}

	var setting models.SystemSetting
	if err := db.First(&setting, "key = ?", "clinic_schedule").Error; err == nil && setting.Value != "" {
		_ = json.Unmarshal([]byte(setting.Value), &sched)
	}
	return sched
}

// GetClinicSchedule returns the current clinic schedule and open/closed status
func (h *SettingsHandler) GetClinicSchedule(c *gin.Context) {
	sched := GetClinicScheduleFromDB()
	c.JSON(http.StatusOK, gin.H{
		"data": sched,
	})
}

// UpdateClinicSchedule allows Nurse/Health Worker or Staff to toggle open/closed and edit schedule
func (h *SettingsHandler) UpdateClinicSchedule(c *gin.Context) {
	db := config.DB
	if db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database unavailable"})
		return
	}

	var req ClinicSchedule
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid clinic schedule format"})
		return
	}

	usernameVal, exists := c.Get("username")
	if exists {
		req.UpdatedBy = usernameVal.(string)
	} else {
		req.UpdatedBy = "Nurse / Health Worker"
	}
	req.UpdatedAt = time.Now().Format(time.RFC3339)

	dataBytes, err := json.Marshal(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to serialize clinic schedule"})
		return
	}

	setting := models.SystemSetting{
		Key:       "clinic_schedule",
		Value:     string(dataBytes),
		UpdatedAt: time.Now(),
	}

	var existing models.SystemSetting
	if err := db.First(&existing, "key = ?", "clinic_schedule").Error; err != nil {
		if createErr := db.Create(&setting).Error; createErr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save clinic schedule"})
			return
		}
	} else {
		existing.Value = setting.Value
		existing.UpdatedAt = setting.UpdatedAt
		if saveErr := db.Save(&existing).Error; saveErr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update clinic schedule"})
			return
		}
	}

	statusText := "BUKAS (OPEN)"
	if !req.IsOpen {
		statusText = "SARADO (CLOSED)"
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Matagumpay na na-update ang Clinic Schedule (" + statusText + ")!",
		"data":    req,
	})
}

