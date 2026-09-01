package handlers

import (
	"net/http"

	"backend/internal/config"
	"backend/internal/models"
	"backend/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type NotificationHandler struct{}

func (h *NotificationHandler) List(c *gin.Context) {
	db := config.DB
	var notifications []models.Notification

	userRole, _ := c.Get("role")
	userIDVal, exists := c.Get("userID")

	query := db.Model(&models.Notification{})

	// Residents only see announcements and their personal notifications
	if userRole == "Resident" && exists {
		userID := userIDVal.(uuid.UUID)
		query = query.Where("user_id = ? OR user_id IS NULL", userID)
	} else if userRole != "Resident" {
		// Staff see all notifications
	}

	if err := query.Order("created_at desc").Limit(30).Find(&notifications).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notifications"})
		return
	}

	c.JSON(http.StatusOK, notifications)
}

func (h *NotificationHandler) Read(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Notification ID"})
		return
	}

	db := config.DB
	if err := db.Model(&models.Notification{}).Where("id = ?", id).Update("is_read", true).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark notification as read"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification read"})
}

func (h *NotificationHandler) CreateAnnouncement(c *gin.Context) {
	var req struct {
		Title   string `json:"title" binding:"required"`
		Content string `json:"content" binding:"required"`
		Type    string `json:"type"` // Alert, Announcement, Emergency
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Type == "" {
		req.Type = "Announcement"
	}

	db := config.DB
	notif := models.Notification{
		ID:      uuid.New(),
		Title:   req.Title,
		Content: req.Content,
		Type:    req.Type,
		IsRead:  false,
	}

	if err := db.Create(&notif).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save announcement"})
		return
	}

	// Broadcast via WebSocket
	services.Hub.BroadcastNotification(notif.Title, notif.Content, notif.Type)

	// Log audit trail
	userIDVal, _ := c.Get("userID")
	var logUserID *uuid.UUID
	if userIDVal != nil {
		uid := userIDVal.(uuid.UUID)
		logUserID = &uid
	}
	db.Create(&models.AuditLog{
		UserID:    logUserID,
		Action:    "CREATE_ANNOUNCEMENT",
		Details:   "Broadcasted announcement: " + notif.Title,
		IPAddress: c.ClientIP(),
	})

	c.JSON(http.StatusCreated, notif)
}

func (h *NotificationHandler) WebSocketEndpoint(c *gin.Context) {
	services.ServeWs(c.Writer, c.Request)
}
