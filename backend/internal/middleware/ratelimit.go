package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type visitor struct {
	lastSeen time.Time
	count    int
}

// RateLimiter tracks IP request counts within a sliding window
type RateLimiter struct {
	mu       sync.Mutex
	visitors map[string]*visitor
	limit    int
	window   time.Duration
}

func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	rl := &RateLimiter{
		visitors: make(map[string]*visitor),
		limit:    limit,
		window:   window,
	}

	// Periodically clean up old inactive IPs from memory
	go func() {
		for {
			time.Sleep(3 * time.Minute)
			rl.mu.Lock()
			for ip, v := range rl.visitors {
				if time.Since(v.lastSeen) > rl.window*2 {
					delete(rl.visitors, ip)
				}
			}
			rl.mu.Unlock()
		}
	}()

	return rl
}

// RateLimitMiddleware creates a Gin middleware that rate-limits requests per client IP
func RateLimitMiddleware(limit int, window time.Duration) gin.HandlerFunc {
	limiter := NewRateLimiter(limit, window)

	return func(c *gin.Context) {
		ip := c.ClientIP()

		limiter.mu.Lock()
		v, exists := limiter.visitors[ip]
		now := time.Now()

		if !exists || now.Sub(v.lastSeen) > window {
			limiter.visitors[ip] = &visitor{
				lastSeen: now,
				count:    1,
			}
			limiter.mu.Unlock()
			c.Next()
			return
		}

		v.count++
		v.lastSeen = now

		if v.count > limit {
			limiter.mu.Unlock()
			c.Header("Retry-After", "60")
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "Too many requests. Please slow down and try again later.",
			})
			c.Abort()
			return
		}

		limiter.mu.Unlock()
		c.Next()
	}
}
