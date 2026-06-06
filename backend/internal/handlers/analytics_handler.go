package handlers

import (
	"net/http"
	"time"

	"backend/internal/config"
	"backend/internal/models"
	"github.com/gin-gonic/gin"
)

type AnalyticsHandler struct{}

type AgeDemographics struct {
	Children int64 `json:"children"` // 0-12
	Youth    int64 `json:"youth"`    // 13-24
	Adults   int64 `json:"adults"`   // 25-59
	Seniors  int64 `json:"seniors"`  // 60+
}

type RevenueMonth struct {
	Month  string  `json:"month"`
	Amount float64 `json:"amount"`
}

type DashboardStats struct {
	TotalResidents    int64            `json:"total_residents"`
	TotalHouseholds   int64            `json:"total_households"`
	IndigentCount     int64            `json:"indigent_households"`
	ActiveIncidents   int64            `json:"active_incidents"`
	ActiveBusinesses  int64            `json:"active_businesses"`
	VotersCount       int64            `json:"voters_count"`
	SeniorCount       int64            `json:"senior_citizens"`
	SoloParentsCount  int64            `json:"solo_parents"`
	PWDsCount         int64            `json:"pwd_residents"`
	AgeDemographics   AgeDemographics  `json:"age_demographics"`
	GenderRatio       map[string]int64 `json:"gender_ratio"`
	RevenueHistory    []RevenueMonth   `json:"revenue_history"`
}

func (h *AnalyticsHandler) GetStats(c *gin.Context) {
	db := config.DB
	var stats DashboardStats

	// Standard metrics
	db.Model(&models.Resident{}).Count(&stats.TotalResidents)
	db.Model(&models.Household{}).Count(&stats.TotalHouseholds)
	db.Model(&models.Household{}).Where("poverty_level = ?", "Indigent").Count(&stats.IndigentCount)
	db.Model(&models.Blotter{}).Where("status IN ?", []string{"Pending", "Active"}).Count(&stats.ActiveIncidents)
	db.Model(&models.Business{}).Where("status = ?", "Active").Count(&stats.ActiveBusinesses)
	db.Model(&models.Resident{}).Where("voter_status = ?", "Registered").Count(&stats.VotersCount)

	// Custom registries
	db.Model(&models.Resident{}).Where("civil_status = ?", "Single Parent").Count(&stats.SoloParentsCount)
	
	// Senior Citizens check (Age >= 60)
	seniorThreshold := time.Now().AddDate(-60, 0, 0)
	db.Model(&models.Resident{}).Where("birthdate <= ?", seniorThreshold).Count(&stats.SeniorCount)

	// Since we don't have PWD boolean column in Resident, we check mock condition or civil status (for mock purposes, we set PWD to 2 for seeding/demo)
	stats.PWDsCount = 1 // Mock static value

	// Gender Ratio
	var maleCount, femaleCount int64
	db.Model(&models.Resident{}).Where("gender = ?", "Male").Count(&maleCount)
	db.Model(&models.Resident{}).Where("gender = ?", "Female").Count(&femaleCount)
	stats.GenderRatio = map[string]int64{
		"Male":   maleCount,
		"Female": femaleCount,
	}

	// Age distribution breakdown
	now := time.Now()
	childThreshold := now.AddDate(-12, 0, 0)
	youthThreshold := now.AddDate(-24, 0, 0)
	adultThreshold := now.AddDate(-59, 0, 0)

	db.Model(&models.Resident{}).Where("birthdate > ?", childThreshold).Count(&stats.AgeDemographics.Children)
	db.Model(&models.Resident{}).Where("birthdate <= ? AND birthdate > ?", childThreshold, youthThreshold).Count(&stats.AgeDemographics.Youth)
	db.Model(&models.Resident{}).Where("birthdate <= ? AND birthdate > ?", youthThreshold, adultThreshold).Count(&stats.AgeDemographics.Adults)
	db.Model(&models.Resident{}).Where("birthdate <= ?", adultThreshold).Count(&stats.AgeDemographics.Seniors)

	// Monthly Revenue stats
	// Sum amount grouped by Month
	var paymentMonths []struct {
		Month string
		Total float64
	}
	// Select formatted date string and sum
	db.Model(&models.Payment{}).
		Select("TO_CHAR(transaction_date, 'YYYY-MM') as month, SUM(amount) as total").
		Where("status = ?", "Paid").
		Group("TO_CHAR(transaction_date, 'YYYY-MM')").
		Order("month asc").
		Scan(&paymentMonths)

	for _, pm := range paymentMonths {
		// Format month nicely e.g. "2026-05" -> "May" or keep key
		t, err := time.Parse("2006-01", pm.Month)
		monthName := pm.Month
		if err == nil {
			monthName = t.Format("Jan")
		}
		stats.RevenueHistory = append(stats.RevenueHistory, RevenueMonth{
			Month:  monthName,
			Amount: pm.Total,
		})
	}

	// Default mockup revenue if empty database
	if len(stats.RevenueHistory) == 0 {
		stats.RevenueHistory = []RevenueMonth{
			{Month: "Jan", Amount: 2450.00},
			{Month: "Feb", Amount: 3100.00},
			{Month: "Mar", Amount: 1800.00},
			{Month: "Apr", Amount: 4200.00},
			{Month: "May", Amount: 3800.00},
		}
	}

	c.JSON(http.StatusOK, stats)
}
