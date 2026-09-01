package middleware

import (
	"context"
	"errors"
	"fmt"
	"log"
	"math"
	"net/http"
	"strings"
	"time"

	"backend/internal/config"
	rediscache "backend/internal/redis"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type StrictJWTClaims struct {
	UserID     uuid.UUID `json:"user_id"`
	Username   string    `json:"username"`
	Role       string    `json:"role"`
	ResidentID *uuid.UUID `json:"resident_id,omitempty"`
	Latitude   float64   `json:"lat,omitempty"`
	Longitude  float64   `json:"lon,omitempty"`
	jwt.RegisteredClaims
}

var canaryTokens = map[string]bool{
	"sk-canary-public1": true,
	"sk-canary-public2": true,
	"sk-honeypot-admin":  true,
}

// StrictAuthMiddleware enforces JWT security without query parameter fallbacks.
func StrictAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		rClient := rediscache.GetClient()
		ctx := context.Background()
		clientIP := c.ClientIP()

		// 1. Check if IP is blacklisted in Redis (e.g. from canary trap)
		if rediscache.IsAvailable() {
			isBlacklisted, err := rClient.Exists(ctx, fmt.Sprintf("blacklist:ip:%s", clientIP)).Result()
			if err == nil && isBlacklisted > 0 {
				c.Header("X-Security-Alert", "ip-blacklisted")
				c.JSON(http.StatusForbidden, gin.H{"error": "Access denied. Source IP is blacklisted."})
				c.Abort()
				return
			}
		}

		// 2. CRITICAL FIX: Reject URL Query String Authentication
		if c.Query("token") != "" || c.Query("Authorization") != "" || c.Query("access_token") != "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Query parameter authentication is disabled for security.",
			})
			c.Abort()
			return
		}

		// 3. Extract Authorization Header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// 4. CANARY TOKEN TRAP (Honeypot Scanner)
		if canaryTokens[authHeader] || canaryTokens[strings.TrimPrefix(authHeader, "Bearer ")] {
			log.Printf("SECURITY ALERT [HONEYPOT]: Canary token triggered by IP %s on endpoint %s %s!",
				clientIP, c.Request.Method, c.Request.URL.Path)

			// Blacklist IP in Redis for 1 hour
			if rediscache.IsAvailable() {
				rClient.Set(ctx, fmt.Sprintf("blacklist:ip:%s", clientIP), "canary_trap_triggered", 1*time.Hour)
			}

			c.Header("X-Security-Alert", "canary-trap-triggered")
			c.JSON(http.StatusTeapot, gin.H{
				"error": "Security honeypot trap triggered. Incident logged.",
			})
			c.Abort()
			return
		}

		// 5. Parse Bearer Token
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header must use format: Bearer <token>"})
			c.Abort()
			return
		}

		tokenString := parts[1]
		claims := &StrictJWTClaims{}
		cfg := config.LoadConfig()

		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, errors.New("unexpected signing method")
			}
			return []byte(cfg.JWTSecret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired JWT token"})
			c.Abort()
			return
		}

		// 6. Check Token Blocklist in Redis (e.g., invalidated via logout or impossible travel)
		if claims.ID != "" && rediscache.IsAvailable() {
			isBlocked, err := rClient.Exists(ctx, fmt.Sprintf("blocklist:jti:%s", claims.ID)).Result()
			if err == nil && isBlocked > 0 {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Token has been revoked due to a security policy."})
				c.Abort()
				return
			}
		}

		// 7. IMPOSSIBLE TRAVEL ANOMALY DETECTION
		if claims.Latitude != 0 || claims.Longitude != 0 {
			if checkImpossibleTravel(c, ctx, claims, clientIP) {
				// Block token in Redis
				if claims.ID != "" && rediscache.IsAvailable() {
					rClient.Set(ctx, fmt.Sprintf("blocklist:jti:%s", claims.ID), "impossible_travel", 24*time.Hour)
				}

				c.Header("X-Security-Alert", "impossible-travel")
				c.JSON(http.StatusForbidden, gin.H{
					"error": "Impossible travel anomaly detected. Session terminated for security.",
				})
				c.Abort()
				return
			}
		}

		// Set Context values
		c.Set("userID", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("role", claims.Role)
		if claims.ResidentID != nil {
			c.Set("residentID", *claims.ResidentID)
		}

		c.Next()
	}
}

// checkImpossibleTravel evaluates distance (>500km) and time (<2h) between last login and current request.
func checkImpossibleTravel(c *gin.Context, ctx context.Context, claims *StrictJWTClaims, currentIP string) bool {
	rClient := rediscache.GetClient()
	if !rediscache.IsAvailable() {
		return false
	}

	key := fmt.Sprintf("user:last_location:%s", claims.UserID.String())
	lastLoc, err := rClient.HGetAll(ctx, key).Result()
	if err != nil || len(lastLoc) == 0 {
		// Store current location state
		rClient.HSet(ctx, key, map[string]interface{}{
			"lat":       claims.Latitude,
			"lon":       claims.Longitude,
			"timestamp": time.Now().Unix(),
			"ip":        currentIP,
		})
		return false
	}

	var lastLat, lastLon float64
	var lastTime int64
	fmt.Sscanf(lastLoc["lat"], "%f", &lastLat)
	fmt.Sscanf(lastLoc["lon"], "%f", &lastLon)
	fmt.Sscanf(lastLoc["timestamp"], "%d", &lastTime)

	timeDiffHours := time.Since(time.Unix(lastTime, 0)).Hours()
	distanceKm := haversineDistance(lastLat, lastLon, claims.Latitude, claims.Longitude)

	// Anomaly condition: Distance > 500 km AND time elapsed < 2 hours
	if distanceKm > 500.0 && timeDiffHours < 2.0 {
		log.Printf("SECURITY ALERT [IMPOSSIBLE TRAVEL]: User %s moved %.2f km in %.2f hours from IP %s to %s",
			claims.UserID, distanceKm, timeDiffHours, lastLoc["ip"], currentIP)
		return true
	}

	// Update location state
	rClient.HSet(ctx, key, map[string]interface{}{
		"lat":       claims.Latitude,
		"lon":       claims.Longitude,
		"timestamp": time.Now().Unix(),
		"ip":        currentIP,
	})

	return false
}

// haversineDistance calculates distance in kilometers between two GPS points.
func haversineDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371.0 // Earth radius in km
	dLat := (lat2 - lat1) * (math.Pi / 180.0)
	dLon := (lon2 - lon1) * (math.Pi / 180.0)

	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*(math.Pi/180.0))*math.Cos(lat2*(math.Pi/180.0))*
			math.Sin(dLon/2)*math.Sin(dLon/2)

	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return R * c
}
