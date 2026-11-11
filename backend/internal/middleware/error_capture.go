package middleware

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"time"

	"backend/internal/config"
	"backend/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// responseBodyWriter wraps gin.ResponseWriter to capture the response body
type responseBodyWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (r responseBodyWriter) Write(b []byte) (int, error) {
	r.body.Write(b)
	return r.ResponseWriter.Write(b)
}

// ErrorCaptureMiddleware intercepts all HTTP responses and logs 4xx/5xx errors
// to the error_logs table so the Developer can inspect them in real-time.
func ErrorCaptureMiddleware() gin.HandlerFunc {
	// paths to skip logging (health checks, static assets, root probes, etc.)
	skipPaths := map[string]bool{
		"/":                     true,
		"/favicon.ico":          true,
		"/robots.txt":           true,
		"/api/ping":             true,
		"/api/system/db-status": true,
		"/api/ws":               true,
	}

	return func(c *gin.Context) {
		// Skip HEAD requests and preflight OPTIONS
		if c.Request.Method == "HEAD" || c.Request.Method == "OPTIONS" {
			c.Next()
			return
		}

		path := c.FullPath()
		if path == "" {
			path = c.Request.URL.Path
		}

		// Skip noise paths
		if skipPaths[path] || strings.HasPrefix(path, "/uploads") {
			c.Next()
			return
		}

		// Wrap the response writer to capture body
		blw := &responseBodyWriter{body: new(bytes.Buffer), ResponseWriter: c.Writer}
		c.Writer = blw

		start := time.Now()
		c.Next()
		_ = start

		status := c.Writer.Status()

		// Only log errors: 4xx and 5xx
		if status < 400 {
			return
		}

		// Extract error message from response body
		message := extractErrorMessage(blw.body.Bytes(), status, c.Request.URL.Path)

		// Determine severity level
		level := "error"
		if status >= 500 {
			level = "panic"
		} else if status == 401 || status == 403 {
			level = "warning"
		}

		// Get user ID if available
		var userID *uuid.UUID
		if val, exists := c.Get("userID"); exists {
			if uid, ok := val.(uuid.UUID); ok {
				userID = &uid
			}
		}

		db := config.DB
		if db == nil {
			return
		}

		errLog := models.ErrorLog{
			Source:     "backend",
			Level:      level,
			StatusCode: status,
			Method:     c.Request.Method,
			Path:       c.Request.URL.Path,
			Message:    message,
			UserID:     userID,
			IPAddress:  c.ClientIP(),
			UserAgent:  c.Request.UserAgent(),
		}

		// Non-blocking DB write
		go db.Create(&errLog)
	}
}

func extractErrorMessage(body []byte, status int, path string) string {
	if len(body) == 0 {
		return http.StatusText(status)
	}

	// Try to parse JSON {"error": "..."} response
	var payload map[string]interface{}
	if err := json.Unmarshal(body, &payload); err == nil {
		if msg, ok := payload["error"].(string); ok && msg != "" {
			return msg
		}
		if msg, ok := payload["message"].(string); ok && msg != "" {
			return msg
		}
	}

	// Fallback: first 300 chars of raw body
	raw := strings.TrimSpace(string(body))
	if len(raw) > 300 {
		raw = raw[:300] + "…"
	}
	if raw != "" {
		return raw
	}
	return http.StatusText(status)
}

// ReportFrontendError accepts JS errors POSTed from the React frontend
func ReportFrontendError(c *gin.Context) {
	var req struct {
		Message   string `json:"message" binding:"required"`
		Stack     string `json:"stack"`
		Path      string `json:"path"`
		UserAgent string `json:"user_agent"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB
	if db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "DB unavailable"})
		return
	}

	// Get optional user context
	var userID *uuid.UUID
	if val, exists := c.Get("userID"); exists {
		if uid, ok := val.(uuid.UUID); ok {
			userID = &uid
		}
	}

	ua := req.UserAgent
	if ua == "" {
		ua = c.Request.UserAgent()
	}

	errLog := models.ErrorLog{
		Source:    "frontend",
		Level:     "error",
		Path:      req.Path,
		Message:   req.Message,
		Stack:     req.Stack,
		UserID:    userID,
		IPAddress: c.ClientIP(),
		UserAgent: ua,
	}

	if err := db.Create(&errLog).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to log error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Error logged"})
}

// ReadBody reads and restores the request body (for logging purposes)
func ReadBody(c *gin.Context) []byte {
	if c.Request.Body == nil {
		return nil
	}
	data, _ := io.ReadAll(c.Request.Body)
	c.Request.Body = io.NopCloser(bytes.NewBuffer(data))
	return data
}
