package middleware

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"backend/internal/config"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type JWTClaims struct {
	UserID     uuid.UUID `json:"user_id"`
	Username   string    `json:"username"`
	Role       string    `json:"role"`
	ResidentID *uuid.UUID `json:"resident_id,omitempty"`
	jwt.RegisteredClaims
}

// GenerateJWT creates a new token valid for 24 hours
func GenerateJWT(userID uuid.UUID, username, role string, residentID *uuid.UUID) (string, error) {
	claims := JWTClaims{
		UserID:     userID,
		Username:   username,
		Role:       role,
		ResidentID: residentID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	cfg := config.LoadConfig()
	return token.SignedString([]byte(cfg.JWTSecret))
}

// AuthMiddleware intercepts requests and checks for valid JWT
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		tokenString := ""

		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && parts[0] == "Bearer" {
				tokenString = parts[1]
			}
		}

		// Fallback to URL query parameter if Authorization header is missing (e.g. for CSV/PDF downloads)
		if tokenString == "" {
			if qToken := c.Query("token"); qToken != "" {
				tokenString = qToken
			} else if qAuth := c.Query("Authorization"); qAuth != "" {
				parts := strings.Split(qAuth, " ")
				if len(parts) == 2 && parts[0] == "Bearer" {
					tokenString = parts[1]
				} else {
					tokenString = qAuth
				}
			}
		}

		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization token required"})
			c.Abort()
			return
		}
		claims := &JWTClaims{}

		cfg := config.LoadConfig()
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, errors.New("unexpected signing method")
			}
			return []byte(cfg.JWTSecret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// Store user data in Gin context
		c.Set("userID", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("role", claims.Role)
		if claims.ResidentID != nil {
			c.Set("residentID", *claims.ResidentID)
		}

		c.Next()
	}
}
