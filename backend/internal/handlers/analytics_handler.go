package handlers

import (
	"net/http"
	"strings"
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
	TotalResidents   int64            `json:"total_residents"`
	TotalHouseholds  int64            `json:"total_households"`
	IndigentCount    int64            `json:"indigent_households"`
	ActiveIncidents  int64            `json:"active_incidents"`
	ActiveBusinesses int64            `json:"active_businesses"`
	VotersCount      int64            `json:"voters_count"`
	SeniorCount      int64            `json:"senior_citizens"`
	SoloParentsCount int64            `json:"solo_parents"`
	PWDsCount        int64            `json:"pwd_residents"`
	TotalClearances  int64            `json:"total_clearances"`
	TotalAIQueries   int64            `json:"total_ai_queries"`
	AgeDemographics  AgeDemographics  `json:"age_demographics"`
	GenderRatio      map[string]int64 `json:"gender_ratio"`
	RevenueHistory   []RevenueMonth   `json:"revenue_history"`
}

func (h *AnalyticsHandler) GetStats(c *gin.Context) {
	statsCacheMutex.RLock()
	if cachedStats != nil && time.Since(statsCachedAt) < 120*time.Second {
		copyStats := *cachedStats
		statsCacheMutex.RUnlock()
		c.JSON(http.StatusOK, copyStats)
		return
	}
	statsCacheMutex.RUnlock()

	db := config.DB
	if db == nil {
		c.JSON(http.StatusOK, DashboardStats{})
		return
	}

	var stats DashboardStats

	now := time.Now()
	seniorThreshold := now.AddDate(-60, 0, 0)
	childThreshold := now.AddDate(-12, 0, 0)
	youthThreshold := now.AddDate(-24, 0, 0)
	adultThreshold := now.AddDate(-59, 0, 0)

	// Query 1: Resident demographics in 1 single fast query
	type residentDemographics struct {
		Gender      string
		Birthdate   time.Time
		CivilStatus string
		VoterStatus string
		IsPWD       bool
	}
	var list []residentDemographics
	db.Model(&models.Resident{}).
		Select("gender, birthdate, civil_status, voter_status, is_pwd").
		Find(&list)

	var males, females, voters, soloParents, seniors, children, youth, adults, pwds int64
	for _, r := range list {
		if strings.EqualFold(r.Gender, "Male") {
			males++
		} else if strings.EqualFold(r.Gender, "Female") {
			females++
		}
		if strings.EqualFold(r.VoterStatus, "Registered") || strings.EqualFold(r.VoterStatus, "Registered Voter") {
			voters++
		}
		if strings.EqualFold(r.CivilStatus, "Single Parent") {
			soloParents++
		}
		if r.IsPWD {
			pwds++
		}
		if !r.Birthdate.IsZero() {
			if r.Birthdate.Before(seniorThreshold) || r.Birthdate.Equal(seniorThreshold) {
				seniors++
			}
			if r.Birthdate.After(childThreshold) {
				children++
			} else if r.Birthdate.After(youthThreshold) {
				youth++
			} else if r.Birthdate.After(adultThreshold) {
				adults++
			}
		}
	}

	stats.TotalResidents = int64(len(list))
	stats.VotersCount = voters
	stats.SoloParentsCount = soloParents
	stats.SeniorCount = seniors
	stats.PWDsCount = pwds
	stats.GenderRatio = map[string]int64{"Male": males, "Female": females}
	stats.AgeDemographics = AgeDemographics{
		Children: children,
		Youth:    youth,
		Adults:   adults,
		Seniors:  seniors,
	}

	// Query 2: Fetch all 5 aggregate counts in a single SQL round-trip to prevent connection pool contention
	var aggCounts struct {
		TotalHouseholds  int64
		IndigentCount    int64
		ActiveIncidents  int64
		ActiveBusinesses int64
		TotalClearances  int64
	}
	db.Raw(`
		SELECT
			(SELECT COUNT(*) FROM households WHERE deleted_at IS NULL) AS total_households,
			(SELECT COUNT(*) FROM households WHERE deleted_at IS NULL AND poverty_level = 'Indigent') AS indigent_count,
			(SELECT COUNT(*) FROM blotters WHERE deleted_at IS NULL AND status IN ('Pending', 'Active')) AS active_incidents,
			(SELECT COUNT(*) FROM businesses WHERE deleted_at IS NULL AND status = 'Active') AS active_businesses,
			(SELECT COUNT(*) FROM certificates WHERE deleted_at IS NULL) AS total_clearances
	`).Scan(&aggCounts)

	stats.TotalHouseholds = aggCounts.TotalHouseholds
	stats.IndigentCount = aggCounts.IndigentCount
	stats.ActiveIncidents = aggCounts.ActiveIncidents
	stats.ActiveBusinesses = aggCounts.ActiveBusinesses
	stats.TotalClearances = aggCounts.TotalClearances

	// Default revenue structure
	stats.RevenueHistory = []RevenueMonth{
		{Month: "Jan", Amount: 0.00},
		{Month: "Feb", Amount: 0.00},
		{Month: "Mar", Amount: 0.00},
		{Month: "Apr", Amount: 0.00},
		{Month: "May", Amount: 0.00},
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
	var pubCounts struct {
		TotalResidents  int64
		TotalClearances int64
		ActiveIncidents int64
		TotalBusinesses int64
	}
	if db != nil {
		db.Raw(`
			SELECT
				(SELECT COUNT(*) FROM residents WHERE deleted_at IS NULL) AS total_residents,
				(SELECT COUNT(*) FROM certificates WHERE deleted_at IS NULL) AS total_clearances,
				(SELECT COUNT(*) FROM blotters WHERE deleted_at IS NULL AND status IN ('Pending', 'Active')) AS active_incidents,
				(SELECT COUNT(*) FROM businesses WHERE deleted_at IS NULL AND status = 'Active') AS total_businesses
		`).Scan(&pubCounts)
	}

	res := gin.H{
		"total_residents":  pubCounts.TotalResidents,
		"total_clearances": pubCounts.TotalClearances,
		"active_incidents": pubCounts.ActiveIncidents,
		"total_businesses": pubCounts.TotalBusinesses,
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
