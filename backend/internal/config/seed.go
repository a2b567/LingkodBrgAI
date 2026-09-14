package config

import (
	"log"
	"time"

	"backend/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func SeedDatabase(db *gorm.DB) error {
	hashPassword := func(pw string) string {
		hash, _ := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)
		return string(hash)
	}

	defaultUsers := []models.User{
		{
			Username:     "admin",
			Email:        "admin@barangay.gov",
			PasswordHash: hashPassword("Admin@2026!"),
			Role:         "Super Admin",
			IsVerified:   true,
		},
		{
			Username:     "captain",
			Email:        "captain@barangay.gov",
			PasswordHash: hashPassword("Captain@2026!"),
			Role:         "Barangay Captain",
			IsVerified:   true,
		},
		{
			Username:     "secretary",
			Email:        "secretary@barangay.gov",
			PasswordHash: hashPassword("Secretary@2026!"),
			Role:         "Secretary",
			IsVerified:   true,
		},
		{
			Username:     "healthworker",
			Email:        "health@barangay.gov",
			PasswordHash: hashPassword("Health@2026!"),
			Role:         "Health Worker",
			IsVerified:   true,
		},
		{
			Username:     "treasurer",
			Email:        "treasurer@barangay.gov",
			PasswordHash: hashPassword("Treasurer@2026!"),
			Role:         "Treasurer",
			IsVerified:   true,
		},
	}

	for _, u := range defaultUsers {
		var existingUser models.User
		err := db.Where("username = ?", u.Username).First(&existingUser).Error
		if err != nil {
			if err := db.Create(&u).Error; err != nil {
				log.Printf("Failed to seed user %s: %v", u.Username, err)
			} else {
				log.Printf("Seeded default account: %s (%s)", u.Username, u.Role)
			}
		} else {
			// Update password hash and role to ensure default credentials match
			db.Model(&existingUser).Updates(map[string]interface{}{
				"password_hash": u.PasswordHash,
				"role":          u.Role,
				"is_verified":   true,
			})
		}
	}

	// Seed a default active license (required for system to operate)
	var licenseCount int64
	db.Model(&models.License{}).Count(&licenseCount)
	if licenseCount == 0 {
		defaultLicense := models.License{
			LicenseKey:    "LINGKOD-BRGY-2026-ACTIVE",
			CustomerName:  "Barangay",
			CustomerEmail: "admin@barangay.gov",
			MaxUsers:      100,
			IssuedDate:    time.Now(),
			IsActive:      true,
			IsPerpetual:   true,
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}
		db.Create(&defaultLicense)
	}

	return nil
}
