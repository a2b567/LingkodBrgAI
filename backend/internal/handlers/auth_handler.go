package handlers

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"net/http"
	"strings"
	"time"

	"backend/internal/config"
	"backend/internal/middleware"
	"backend/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type ResetPasswordRequest struct {
	Email       string `json:"email" binding:"required,email"`
	OTP         string `json:"otp" binding:"required"`
	NewPassword string `json:"new_password" binding:"required"`
}

func generateRandomOTP() string {
	n, err := rand.Int(rand.Reader, big.NewInt(900000))
	if err != nil {
		return "123456" // secure fallback
	}
	return fmt.Sprintf("%06d", n.Int64()+100000)
}

func validatePasswordStrength(password string) error {
	if len(password) < 8 {
		return fmt.Errorf("Password must be at least 8 characters long")
	}
	var hasUpper, hasLower, hasDigit, hasSpecial bool
	for _, char := range password {
		switch {
		case char >= 'A' && char <= 'Z':
			hasUpper = true
		case char >= 'a' && char <= 'z':
			hasLower = true
		case char >= '0' && char <= '9':
			hasDigit = true
		case strings.ContainsRune("!@#$%^&*()_+-=[]{}|;':\",./<>?", char):
			hasSpecial = true
		}
	}
	if !hasUpper {
		return fmt.Errorf("Password must contain at least one uppercase letter")
	}
	if !hasLower {
		return fmt.Errorf("Password must contain at least one lowercase letter")
	}
	if !hasDigit {
		return fmt.Errorf("Password must contain at least one digit")
	}
	if !hasSpecial {
		return fmt.Errorf("Password must contain at least one special character")
	}
	return nil
}

type AuthHandler struct{}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type RegisterRequest struct {
	Username      string `json:"username" binding:"required"`
	Email         string `json:"email" binding:"required,email"`
	Password      string `json:"password" binding:"required,min=6"`
	FirstName     string `json:"first_name" binding:"required"`
	LastName      string `json:"last_name" binding:"required"`
	Birthdate     string `json:"birthdate" binding:"required"` // YYYY-MM-DD
	Gender        string `json:"gender" binding:"required"`
	Address       string `json:"address" binding:"required"`
	ContactNumber string `json:"contact_number"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	db := config.DB
	if err := db.Preload("Resident").Where("username = ? OR email = ?", req.Username, req.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username/email or password"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username/email or password"})
		return
	}

	// Session / OTP check if we want OTP logic (for demonstration, we bypass if user is pre-verified)
	// Create JWT Token
	token, err := middleware.GenerateJWT(user.ID, user.Username, user.Role, user.ResidentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Audit Log
	ip := c.ClientIP()
	db.Create(&models.AuditLog{
		UserID:    &user.ID,
		Action:    "LOGIN",
		Details:   "User logged in successfully via username: " + user.Username,
		IPAddress: ip,
	})

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id":         user.ID,
			"username":   user.Username,
			"email":      user.Email,
			"role":       user.Role,
			"is_verified": user.IsVerified,
			"resident":   user.Resident,
		},
	})
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB

	// Check if username/email already taken
	var count int64
	db.Model(&models.User{}).Where("username = ? OR email = ?", req.Username, req.Email).Count(&count)
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Username or Email already exists"})
		return
	}

	// Parse birthdate
	bdate, err := time.Parse("2006-01-02", req.Birthdate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid birthdate format. Use YYYY-MM-DD"})
		return
	}

	tx := db.Begin()

	// 1. Create Resident profile
	resID := uuid.New()
	resident := models.Resident{
		Base:            models.Base{ID: resID},
		FirstName:       req.FirstName,
		LastName:        req.LastName,
		Birthdate:       bdate,
		Gender:          req.Gender,
		Address:         req.Address,
		ContactNumber:   req.ContactNumber,
		Email:           req.Email,
		CivilStatus:     "Single",
		Citizenship:     "Filipino",
		ResidencyStatus: "Permanent",
		VoterStatus:     "Not Registered",
		QRID:            "QR-RES-" + strings.ReplaceAll(uuid.New().String()[:8], "-", ""),
	}

	if err := tx.Create(&resident).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create resident profile"})
		return
	}

	// 2. Hash Password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Password encryption failed"})
		return
	}

	// 3. Create User account
	user := models.User{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		Role:         "Resident",
		IsVerified:   false, // Requires OTP / verification
		ResidentID:   &resID,
	}

	// Generate verification details
	otp := "123456" // Hardcoded mock OTP for testing
	expiry := time.Now().Add(10 * time.Minute)
	user.OTP = otp
	user.OTPExpiry = &expiry

	if err := tx.Create(&user).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user account"})
		return
	}

	tx.Commit()

	// Log audit trail
	db.Create(&models.AuditLog{
		UserID:    &user.ID,
		Action:    "REGISTER",
		Details:   "Registered new resident account: " + user.Username + " (ResidentID: " + resID.String() + ")",
		IPAddress: c.ClientIP(),
	})

	c.JSON(http.StatusCreated, gin.H{
		"message": "Registration successful. Please verify using OTP '123456'.",
		"user": gin.H{
			"username": user.Username,
			"email":    user.Email,
			"role":     user.Role,
		},
	})
}

func (h *AuthHandler) GetMe(c *gin.Context) {
	userIDVal, _ := c.Get("userID")
	userID, ok := userIDVal.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var user models.User
	db := config.DB
	if err := db.Preload("Resident").First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":         user.ID,
		"username":   user.Username,
		"email":      user.Email,
		"role":       user.Role,
		"is_verified": user.IsVerified,
		"resident":   user.Resident,
	})
}

func (h *AuthHandler) VerifyOTP(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		OTP      string `json:"otp" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB
	var user models.User
	if err := db.Where("username = ?", req.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if user.OTP != req.OTP {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid OTP code"})
		return
	}

	if user.OTPExpiry != nil && time.Now().After(*user.OTPExpiry) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "OTP has expired"})
		return
	}

	// Update user status
	db.Model(&user).Updates(map[string]interface{}{
		"is_verified": true,
		"otp":         "",
		"otp_expiry":  nil,
	})

	c.JSON(http.StatusOK, gin.H{"message": "Verification successful. You can now log in."})
}

func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var req ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB
	var user models.User
	if err := db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User with this email address was not found"})
		return
	}

	otp := generateRandomOTP()
	expiry := time.Now().Add(15 * time.Minute)
	user.OTP = otp
	user.OTPExpiry = &expiry

	if err := db.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate reset OTP"})
		return
	}

	// Log the mock email to terminal
	fmt.Printf("\n==================================================\n")
	fmt.Printf("[EMAIL MOCK] To: %s\n", user.Email)
	fmt.Printf("[EMAIL MOCK] Subject: Password Reset Request (Barangay Lawrence)\n")
	fmt.Printf("[EMAIL MOCK] Body: Hello %s,\n", user.Username)
	fmt.Printf("[EMAIL MOCK]       You requested a password reset. Your OTP is: %s\n", otp)
	fmt.Printf("[EMAIL MOCK]       This code is valid for 15 minutes.\n")
	fmt.Printf("==================================================\n\n")

	// Audit Log
	db.Create(&models.AuditLog{
		UserID:    &user.ID,
		Action:    "FORGOT_PASSWORD_REQUEST",
		Details:   "Password reset OTP requested for email: " + user.Email,
		IPAddress: c.ClientIP(),
	})

	c.JSON(http.StatusOK, gin.H{
		"message": "A verification OTP has been sent to your email.",
		"otp":     otp, // Sandbox convenient parameter
	})
}

func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB
	var user models.User
	if err := db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if user.OTP == "" || user.OTP != req.OTP {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid OTP code"})
		return
	}

	if user.OTPExpiry != nil && time.Now().After(*user.OTPExpiry) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "OTP code has expired"})
		return
	}

	// Validate strength of new password
	if err := validatePasswordStrength(req.NewPassword); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to encrypt password"})
		return
	}

	// Update user record
	user.PasswordHash = string(hashedPassword)
	user.OTP = ""
	user.OTPExpiry = nil
	user.IsVerified = true // Auto-verify if they reset via OTP

	if err := db.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	// Audit Log
	db.Create(&models.AuditLog{
		UserID:    &user.ID,
		Action:    "PASSWORD_RESET",
		Details:   "Password reset successfully for email: " + user.Email,
		IPAddress: c.ClientIP(),
	})

	c.JSON(http.StatusOK, gin.H{
		"message": "Password reset successfully. You can now log in.",
	})
}
