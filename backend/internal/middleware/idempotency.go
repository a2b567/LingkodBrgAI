package middleware

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	rediscache "backend/internal/redis"
	"github.com/gin-gonic/gin"
)

type CachedResponse struct {
	Status      int                 `json:"status"`
	Body        string              `json:"body"`
	ContentType string              `json:"content_type"`
	Headers     map[string][]string `json:"headers"`
}

type bodyWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (w bodyWriter) Write(b []byte) (int, error) {
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}

// IdempotencyMiddleware prevents double-submitting critical transactions (e.g. PDF Certificate issuance).
func IdempotencyMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		idempotencyKey := c.GetHeader("Idempotency-Key")
		if idempotencyKey == "" {
			// No key provided; proceed normally
			c.Next()
			return
		}

		rClient := rediscache.GetClient()

		// Fail-Open Check: If Redis is unreachable, log warning and allow request
		if !rediscache.IsAvailable() {
			log.Printf("WARNING [FAIL-OPEN]: Redis unavailable for Idempotency check key '%s'. Proceeding with request.", idempotencyKey)
			c.Next()
			return
		}

		userIDVal, exists := c.Get("userID")
		userIDStr := "anonymous"
		if exists {
			userIDStr = fmt.Sprintf("%v", userIDVal)
		}

		redisKey := fmt.Sprintf("idempotent:%s:%s", userIDStr, idempotencyKey)
		ctx := context.Background()

		// 1. Check if response is already cached in Redis
		cachedJSON, err := rClient.Get(ctx, redisKey).Result()
		if err == nil && cachedJSON != "" {
			var cached CachedResponse
			if err := json.Unmarshal([]byte(cachedJSON), &cached); err == nil {
				c.Header("X-Cache-Lookup", "HIT-Idempotent")
				for k, vals := range cached.Headers {
					for _, v := range vals {
						c.Header(k, v)
					}
				}
				if cached.ContentType != "" {
					c.Header("Content-Type", cached.ContentType)
				}
				c.String(cached.Status, cached.Body)
				c.Abort()
				return
			}
		}

		// 2. Wrap Response Writer to capture generated output
		bw := &bodyWriter{body: bytes.NewBufferString(""), ResponseWriter: c.Writer}
		c.Writer = bw

		c.Next()

		// 3. Cache successful 20x responses in Redis for 24 hours
		if c.Writer.Status() >= 200 && c.Writer.Status() < 300 {
			toCache := CachedResponse{
				Status:      c.Writer.Status(),
				Body:        bw.body.String(),
				ContentType: c.Writer.Header().Get("Content-Type"),
				Headers:     c.Writer.Header(),
			}

			serialized, err := json.Marshal(toCache)
			if err == nil {
				rClient.Set(ctx, redisKey, string(serialized), 24*time.Hour)
			}
		}
	}
}
