package middleware

import (
	"time"

	"backend/internal/config"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type JWTClaims struct {
	UserID     uuid.UUID  `json:"user_id"`
	Username   string     `json:"username"`
	Role       string     `json:"role"`
	ResidentID *uuid.UUID `json:"resident_id,omitempty"`
	jwt.RegisteredClaims
}

// GenerateJWT creates a new token valid for 30 days (extended for resident mobile/PWA session longevity)
func GenerateJWT(userID uuid.UUID, username, role string, residentID *uuid.UUID) (string, error) {
	claims := JWTClaims{
		UserID:     userID,
		Username:   username,
		Role:       role,
		ResidentID: residentID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(30 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	cfg := config.LoadConfig()
	return token.SignedString([]byte(cfg.JWTSecret))
}
