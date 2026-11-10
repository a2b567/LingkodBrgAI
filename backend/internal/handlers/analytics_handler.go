package handlers

import (
	"net/http"
	"sync"
	"time"

	"backend/internal/config"
	"backend/internal/models"
	"github.com/gin-gonic/gin"
)

var (
	statsCacheMutex  sync.RWMutex
	cachedStats      *DashboardStats
	statsCachedAt    time.Time
	publicCacheMutex sync.RWMutex
	cachedPublic     gin.H
	publicCachedAt   time.Time
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
	TotalClearances   int64            `json:"total_clearances"`
	TotalAIQueries    int64            `json:"total_ai_queries"`
	AgeDemographics   AgeDemographics  `json:"age_demographics"`
	GenderRatio       map[string]int64 `json:"gender_ratio"`
	RevenueHistory    []RevenueMonth   `json:"revenue_history"`
}

func (h *AnalyticsHandler) GetStats(c *gin.Context) {
	statsCacheMutex.RLock()
	if cachedStats != nil && time.Since(statsCachedAt) < 60*time.Second {
		copyStats := *cachedStats
		statsCacheMutex.RUnlock()
		c.JSON(http.StatusOK, copyStats)
		return
	}
	statsCacheMutex.RUnlock()

	db := config.DB
	var stats DashboardStats

	// Standard metrics
	db.Model(&models.Resident{}).Count(&stats.TotalResidents)
	db.Model(&models.Household{}).Count(&stats.TotalHouseholds)
	db.Model(&models.Household{}).Where("poverty_level = ?", "Indigent").Count(&stats.IndigentCount)
	db.Model(&models.Blotter{}).Where("status IN ?", []string{"Pending", "Active"}).Count(&stats.ActiveIncidents)
	db.Model(&models.Business{}).Where("status = ?", "Active").Count(&stats.ActiveBusinesses)
	db.Model(&models.Resident{}).Where("voter_status = ?", "Registered").Count(&stats.VotersCount)
	db.Model(&models.Certificate{}).Count(&stats.TotalClearances)

	// Custom registries
	db.Model(&models.Resident{}).Where("civil_status = ?", "Single Parent").Count(&stats.SoloParentsCount)
	stats.PWDsCount = 0

	// High-speed In-Memory Demographic calculation from 1 single query instead of 8 sequential network round-trips
	type ResidentMini struct {
		Gender    string
		Birthdate *time.Time
	}
	var residentMinis []ResidentMini
	db.Model(&models.Resident{}).Select("gender, birthdate").Find(&residentMinis)

	now := time.Now()
	seniorThreshold := now.AddDate(-60, 0, 0)
	childThreshold := now.AddDate(-12, 0, 0)
	youthThreshold := now.AddDate(-24, 0, 0)
	adultThreshold := now.AddDate(-59, 0, 0)

	var maleCount, femaleCount, seniorCount int64
	var childrenCount, youthCount, adultCount, seniorsCount int64

	for _, r := range residentMinis {
		if r.Gender == "Male" {
			maleCount++
		} else if r.Gender == "Female" {
			femaleCount++
		}

		if r.Birthdate != nil {
			bd := *r.Birthdate
			if bd.Before(seniorThreshold) || bd.Equal(seniorThreshold) {
				seniorCount++
			}
			if bd.After(childThreshold) {
				childrenCount++
			} else if bd.After(youthThreshold) {
				youthCount++
			} else if bd.After(adultThreshold) {
				adultCount++
			} else {
				seniorsCount++
			}
		}
	}

	stats.SeniorCount = seniorCount
	stats.GenderRatio = map[string]int64{
		"Male":   maleCount,
		"Female": femaleCount,
	}
	stats.AgeDemographics = AgeDemographics{
		Children: childrenCount,
		Youth:    youthCount,
		Adults:   adultCount,
		Seniors:  seniorsCount,
	}

	// Monthly Revenue stats: calculate from paid payments (compatible with both PostgreSQL and SQLite)
	var payments []models.Payment
	db.Select("transaction_date, amount").Where("status = ?", "Paid").Find(&payments)

	revByMonth := make(map[string]float64)
	for _, p := range payments {
		m := p.TransactionDate.Format("Jan")
		revByMonth[m] += p.Amount
	}

	monthOrder := []string{"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"}
	for _, m := range monthOrder {
		if amt, ok := revByMonth[m]; ok {
			stats.RevenueHistory = append(stats.RevenueHistory, RevenueMonth{
				Month:  m,
				Amount: amt,
			})
		}
	}

	// Default revenue structure if database payments are empty (all 0.00)
	if len(stats.RevenueHistory) == 0 {
		stats.RevenueHistory = []RevenueMonth{
			{Month: "Jan", Amount: 0.00},
			{Month: "Feb", Amount: 0.00},
			{Month: "Mar", Amount: 0.00},
			{Month: "Apr", Amount: 0.00},
			{Month: "May", Amount: 0.00},
		}
	}

	statsCacheMutex.Lock()
	cachedStats = &stats
	statsCachedAt = time.Now()
	statsCacheMutex.Unlock()

	c.JSON(http.StatusOK, stats)
}

func (h *AnalyticsHandler) GetPublicStats(c *gin.Context) {
	publicCacheMutex.RLock()
	if cachedPublic != nil && time.Since(publicCachedAt) < 60*time.Second {
		copyPub := cachedPublic
		publicCacheMutex.RUnlock()
		c.JSON(http.StatusOK, copyPub)
		return
	}
	publicCacheMutex.RUnlock()

	db := config.DB
	var totalResidents int64
	var totalClearances int64
	var activeIncidents int64
	var totalBusinesses int64

	db.Model(&models.Resident{}).Count(&totalResidents)
	db.Model(&models.Certificate{}).Count(&totalClearances)
	db.Model(&models.Blotter{}).Where("status IN ?", []string{"Pending", "Active"}).Count(&activeIncidents)
	db.Model(&models.Business{}).Where("status = ?", "Active").Count(&totalBusinesses)

	res := gin.H{
		"total_residents":  totalResidents,
		"total_clearances": totalClearances,
		"active_incidents": activeIncidents,
		"total_businesses": totalBusinesses,
		"congestion_risk":  "LOW / OPTIMAL",
	}

	publicCacheMutex.Lock()
	cachedPublic = res
	publicCachedAt = time.Now()
	publicCacheMutex.Unlock()

	c.JSON(http.StatusOK, res)
}

func (h *AnalyticsHandler) GetDBStatus(c *gin.Context) {
	c.JSON(http.StatusOK, config.GetDBStatus())
}
