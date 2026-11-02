package handlers

import (
	"net/http"
	"strconv"
	"time"

	"backend/internal/config"
	"backend/internal/models"
	"github.com/gin-gonic/gin"
)

type DevHandler struct{}

// GetErrorLogs returns paginated system error logs (backend HTTP errors + frontend JS exceptions)
func (h *DevHandler) GetErrorLogs(c *gin.Context) {
	db := config.DB

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	source := c.Query("source") // backend | frontend
	level := c.Query("level")   // error | warning | panic
	search := c.Query("search")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 200 {
		limit = 50
	}
	offset := (page - 1) * limit

	query := db.Model(&models.ErrorLog{}).Order("created_at desc")
	if source != "" {
		query = query.Where("source = ?", source)
	}
	if level != "" {
		query = query.Where("level = ?", level)
	}
	if search != "" {
		query = query.Where("message LIKE ? OR path LIKE ? OR ip_address LIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	var total int64
	query.Count(&total)

	var logs []models.ErrorLog
	if err := query.Offset(offset).Limit(limit).Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch error logs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  logs,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// GetAuditLogs returns paginated audit logs with optional filters
func (h *DevHandler) GetAuditLogs(c *gin.Context) {
	db := config.DB

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	action := c.Query("action")
	search := c.Query("search")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 200 {
		limit = 50
	}
	offset := (page - 1) * limit

	type AuditRow struct {
		ID        string  `json:"id"`
		UserID    *string `json:"user_id,omitempty"`
		Username  string  `json:"username"`
		Action    string  `json:"action"`
		Details   string  `json:"details"`
		IPAddress string  `json:"ip_address"`
		CreatedAt string  `json:"created_at"`
	}

	query := db.Model(&models.AuditLog{}).Order("created_at desc")

	if action != "" {
		query = query.Where("action = ?", action)
	}
	if search != "" {
		query = query.Where("details LIKE ? OR ip_address LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	var total int64
	query.Count(&total)

	var logs []models.AuditLog
	if err := query.Offset(offset).Limit(limit).Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch audit logs"})
		return
	}

	// Enrich with usernames
	userCache := map[string]string{}
	result := make([]AuditRow, 0, len(logs))
	for _, l := range logs {
		username := "System"
		if l.UserID != nil {
			uid := l.UserID.String()
			if cached, ok := userCache[uid]; ok {
				username = cached
			} else {
				var u models.User
				if err := db.Select("username").First(&u, "id = ?", l.UserID).Error; err == nil {
					username = u.Username
					userCache[uid] = username
				}
			}
		}

		var uidStr *string
		if l.UserID != nil {
			s := l.UserID.String()
			uidStr = &s
		}

		result = append(result, AuditRow{
			ID:        l.ID.String(),
			UserID:    uidStr,
			Username:  username,
			Action:    l.Action,
			Details:   l.Details,
			IPAddress: l.IPAddress,
			CreatedAt: l.CreatedAt.Format(time.RFC3339),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  result,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// GetAllUsers returns all users (residents + staff) for activity monitoring
func (h *DevHandler) GetAllUsers(c *gin.Context) {
	db := config.DB

	search := c.Query("search")
	role := c.Query("role")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 200 {
		limit = 50
	}
	offset := (page - 1) * limit

	type UserRow struct {
		ID         string  `json:"id"`
		Username   string  `json:"username"`
		Email      string  `json:"email"`
		Role       string  `json:"role"`
		IsVerified bool    `json:"is_verified"`
		CreatedAt  string  `json:"created_at"`
		LastAction *string `json:"last_action,omitempty"`
		LastIP     *string `json:"last_ip,omitempty"`
		LastSeen   *string `json:"last_seen,omitempty"`
	}

	query := db.Model(&models.User{}).Order("created_at desc")
	if search != "" {
		query = query.Where("username LIKE ? OR email LIKE ?", "%"+search+"%", "%"+search+"%")
	}
	if role != "" {
		query = query.Where("role = ?", role)
	}

	var total int64
	query.Count(&total)

	var users []models.User
	if err := query.Offset(offset).Limit(limit).Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	result := make([]UserRow, 0, len(users))
	for _, u := range users {
		row := UserRow{
			ID:         u.ID.String(),
			Username:   u.Username,
			Email:      u.Email,
			Role:       u.Role,
			IsVerified: u.IsVerified,
			CreatedAt:  u.CreatedAt.Format(time.RFC3339),
		}

		// Get last audit log entry for this user
		var lastLog models.AuditLog
		if err := db.Where("user_id = ?", u.ID).Order("created_at desc").First(&lastLog).Error; err == nil {
			action := lastLog.Action
			ip := lastLog.IPAddress
			seen := lastLog.CreatedAt.Format(time.RFC3339)
			row.LastAction = &action
			row.LastIP = &ip
			row.LastSeen = &seen
		}

		result = append(result, row)
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  result,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// GetSystemStats returns system-wide developer statistics
func (h *DevHandler) GetSystemStats(c *gin.Context) {
	db := config.DB

	var totalUsers, totalResidents, totalStaff, totalAuditLogs, totalAILogs int64
	db.Model(&models.User{}).Count(&totalUsers)
	db.Model(&models.User{}).Where("role = ?", "Resident").Count(&totalResidents)
	db.Model(&models.User{}).Where("role != ?", "Resident").Count(&totalStaff)
	db.Model(&models.AuditLog{}).Count(&totalAuditLogs)
	db.Model(&models.AILog{}).Count(&totalAILogs)

	// Top actions breakdown
	type ActionCount struct {
		Action string `json:"action"`
		Count  int64  `json:"count"`
	}
	var topActions []ActionCount
	db.Model(&models.AuditLog{}).
		Select("action, count(*) as count").
		Group("action").
		Order("count desc").
		Limit(10).
		Scan(&topActions)

	// Recent errors / failed logins in last 24h
	var recentLogins int64
	since := time.Now().Add(-24 * time.Hour)
	db.Model(&models.AuditLog{}).
		Where("action = ? AND created_at >= ?", "LOGIN", since).
		Count(&recentLogins)

	c.JSON(http.StatusOK, gin.H{
		"total_users":       totalUsers,
		"total_residents":   totalResidents,
		"total_staff":       totalStaff,
		"total_audit_logs":  totalAuditLogs,
		"total_ai_queries":  totalAILogs,
		"top_actions":       topActions,
		"logins_last_24h":   recentLogins,
	})
}
