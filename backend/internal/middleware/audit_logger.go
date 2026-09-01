package middleware

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

type AuditLogEntry struct {
	Timestamp      string `json:"timestamp_utc"`
	UserID         string `json:"user_id,omitempty"`
	Role           string `json:"role,omitempty"`
	Endpoint       string `json:"endpoint"`
	Method         string `json:"method"`
	ResponseStatus int    `json:"response_status"`
	LatencyMs      int64  `json:"latency_ms"`
	SourceIP       string `json:"source_ip"`
	DocumentID     string `json:"document_id,omitempty"`
}

var (
	auditChan = make(chan AuditLogEntry, 1000)
)

func init() {
	// Start async background worker to process audit logs without blocking HTTP requests
	go asyncAuditWorker()
}

func asyncAuditWorker() {
	for entry := range auditChan {
		serialized, err := json.Marshal(entry)
		if err != nil {
			log.Printf("ERROR: Failed to serialize audit log: %v", err)
			continue
		}
		// Print structured JSON audit log to stdout for log aggregators (Fluentd/Datadog/CloudWatch)
		log.Printf("[AUDIT_LOG] %s", string(serialized))
	}
}

// AsyncAuditLogger returns a Gin middleware that records non-PII audit trails asynchronously.
func AsyncAuditLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		c.Next()

		latency := time.Since(start).Milliseconds()

		userIDStr := ""
		if uid, exists := c.Get("userID"); exists {
			userIDStr = string(formatString(uid))
		}

		roleStr := ""
		if r, exists := c.Get("role"); exists {
			roleStr = string(formatString(r))
		}

		docIDStr := ""
		if docID, exists := c.Get("documentID"); exists {
			docIDStr = string(formatString(docID))
		}

		entry := AuditLogEntry{
			Timestamp:      time.Now().UTC().Format(time.RFC3339),
			UserID:         userIDStr,
			Role:           roleStr,
			Endpoint:       c.Request.URL.Path,
			Method:         c.Request.Method,
			ResponseStatus: c.Writer.Status(),
			LatencyMs:      latency,
			SourceIP:       c.ClientIP(),
			DocumentID:     docIDStr,
		}

		// Push to non-blocking buffered channel
		select {
		case auditChan <- entry:
		default:
			log.Printf("WARNING: Audit log queue full. Dropping audit log for %s %s", entry.Method, entry.Endpoint)
		}
	}
}

func formatString(v interface{}) string {
	if s, ok := v.(string); ok {
		return s
	}
	return ""
}
