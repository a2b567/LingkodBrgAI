package middleware

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	rediscache "backend/internal/redis"
	"github.com/gin-gonic/gin"
	redis "github.com/redis/go-redis/v9"
)

// RedisSlidingWindowRateLimiter implements a sliding window counter using Redis ZSET.
func RedisSlidingWindowRateLimiter(rateKeyPrefix string, limit int, window time.Duration, isUserBased bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		rClient := rediscache.GetClient()

		// Fail-Open Check: If Redis is unavailable, log error and allow request
		if !rediscache.IsAvailable() {
			log.Printf("CRITICAL [FAIL-OPEN]: Redis unavailable for rate limiter %s. Request allowed.", rateKeyPrefix)
			c.Next()
			return
		}

		var identifier string
		if isUserBased {
			userID, exists := c.Get("userID")
			if !exists {
				// Fallback to IP if user not yet authenticated
				identifier = c.ClientIP()
			} else {
				identifier = fmt.Sprintf("user:%v", userID)
			}
		} else {
			identifier = fmt.Sprintf("ip:%s", c.ClientIP())
		}

		key := fmt.Sprintf("ratelimit:%s:%s", rateKeyPrefix, identifier)
		ctx := context.Background()
		now := time.Now()
		nowUnixNano := now.UnixNano()
		windowStartNano := now.Add(-window).UnixNano()

		// Execute Redis ZSET pipeline
		pipe := rClient.Pipeline()
		// 1. Remove timestamps older than the sliding window
		pipe.ZRemRangeByScore(ctx, key, "0", fmt.Sprintf("%d", windowStartNano))
		// 2. Add current request timestamp
		pipe.ZAdd(ctx, key, redis.Z{
			Score:  float64(nowUnixNano),
			Member: nowUnixNano,
		})
		// 3. Count total elements in current window
		cardCmd := pipe.ZCard(ctx, key)
		// 4. Set TTL on key
		pipe.Expire(ctx, key, window*2)

		_, err := pipe.Exec(ctx)
		if err != nil {
			log.Printf("ERROR [FAIL-OPEN]: Redis ZSET rate limit pipeline failed: %v. Allowing request.", err)
			c.Next()
			return
		}

		currentCount := int(cardCmd.Val())
		c.Header("X-RateLimit-Limit", fmt.Sprintf("%d", limit))
		c.Header("X-RateLimit-Remaining", fmt.Sprintf("%d", max(0, limit-currentCount)))

		if currentCount > limit {
			c.Header("Retry-After", fmt.Sprintf("%d", int(window.Seconds())))
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": fmt.Sprintf("Rate limit exceeded (%s). Max %d requests per %s.", rateKeyPrefix, limit, window),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// KioskPublicRateLimiter A: Public/Kiosk endpoints (100 req/min per IP)
func KioskPublicRateLimiter() gin.HandlerFunc {
	return RedisSlidingWindowRateLimiter("kiosk_public", 100, 1*time.Minute, false)
}

// AuthenticatedUserRateLimiter B: Authenticated Captains/Staff (500 req/min per UserID)
func AuthenticatedUserRateLimiter() gin.HandlerFunc {
	return RedisSlidingWindowRateLimiter("auth_user", 500, 1*time.Minute, true)
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
