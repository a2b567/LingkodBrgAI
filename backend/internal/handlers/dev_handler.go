package handlers

import (
	"net/http"
	"strconv"
	"sync"
	"time"

	"backend/internal/config"
	"backend/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type DevHandler struct{}

var sanitizeErrorLogsOnce sync.Once

// GetErrorLogs returns paginated system error logs (backend HTTP errors + frontend JS exceptions)
func (h *DevHandler) GetErrorLogs(c *gin.Context) {
	db := config.DB

	// Run historical error log classification cleanup only once per server lifecycle instead of on every GET request
	sanitizeErrorLogsOnce.Do(func() {
		db.Model(&models.ErrorLog{}).
			Where("level = ? AND LOWER(message) NOT LIKE ? AND LOWER(message) NOT LIKE ?", "panic", "%panic%", "%runtime error%").
			Update("level", "error")

		db.Model(&models.ErrorLog{}).
			Where("status_code >= 400 AND status_code < 500 AND level = ?", "error").
			Update("level", "warning")
	})

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

	// Batch-enrich with usernames in 1 single query instead of N+1 queries
	userCache := map[string]string{}
	var userIDs []uuid.UUID
	seenIDs := map[uuid.UUID]bool{}
	for _, l := range logs {
		if l.UserID != nil && !seenIDs[*l.UserID] {
			seenIDs[*l.UserID] = true
			userIDs = append(userIDs, *l.UserID)
		}
	}
	if len(userIDs) > 0 {
		var users []models.User
		if err := db.Select("id, username").Where("id IN ?", userIDs).Find(&users).Error; err == nil {
			for _, u := range users {
				userCache[u.ID.String()] = u.Username
			}
		}
	}

	result := make([]AuditRow, 0, len(logs))
	for _, l := range logs {
		username := "System"
		if l.UserID != nil {
			if cached, ok := userCache[l.UserID.String()]; ok {
				username = cached
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

	// Batch-fetch latest audit log for all returned users in 1 query instead of N+1 per user
	userIDs := make([]uuid.UUID, 0, len(users))
	for _, u := range users {
		userIDs = append(userIDs, u.ID)
	}
	lastLogByUser := make(map[uuid.UUID]models.AuditLog, len(users))
	if len(userIDs) > 0 {
		var userLogs []models.AuditLog
		if err := db.Where("user_id IN ?", userIDs).Order("created_at desc").Find(&userLogs).Error; err == nil {
			for _, l := range userLogs {
				if l.UserID != nil {
					if _, exists := lastLogByUser[*l.UserID]; !exists {
						lastLogByUser[*l.UserID] = l
					}
				}
			}
		}
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

		if lastLog, ok := lastLogByUser[u.ID]; ok {
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

	since := time.Now().Add(-24 * time.Hour)
	var counts struct {
		TotalUsers     int64
		TotalResidents int64
		TotalStaff     int64
		TotalAuditLogs int64
		TotalAILogs    int64
		RecentLogins   int64
	}
	db.Raw(`
		SELECT
			(SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) AS total_users,
			(SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND role = 'Resident') AS total_residents,
			(SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND role != 'Resident') AS total_staff,
			(SELECT COUNT(*) FROM audit_logs WHERE deleted_at IS NULL) AS total_audit_logs,
			(SELECT COUNT(*) FROM ai_logs WHERE deleted_at IS NULL) AS total_ai_logs,
			(SELECT COUNT(*) FROM audit_logs WHERE deleted_at IS NULL AND action = 'LOGIN' AND created_at >= ?) AS recent_logins
	`, since).Scan(&counts)

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

	c.JSON(http.StatusOK, gin.H{
		"total_users":      counts.TotalUsers,
		"total_residents":  counts.TotalResidents,
		"total_staff":      counts.TotalStaff,
		"total_audit_logs": counts.TotalAuditLogs,
		"total_ai_queries": counts.TotalAILogs,
		"top_actions":      topActions,
		"logins_last_24h":  counts.RecentLogins,
	})
}

// ClearErrorLogs clears all system error logs
func (h *DevHandler) ClearErrorLogs(c *gin.Context) {
	db := config.DB
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database unavailable"})
		return
	}

	if err := db.Exec("DELETE FROM error_logs").Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear error logs: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "All error logs cleared successfully"})
}
