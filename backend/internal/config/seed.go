package config

import (
	"log"
	"time"

	"backend/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func SeedDatabase(db *gorm.DB) error {
	var userCount int64
	db.Model(&models.User{}).Count(&userCount)
	if userCount > 0 {
		log.Println("Database already has users. Skipping seed...")
		return nil
	}

	log.Println("Seeding initial Super Admin account...")

	hashPassword := func(pw string) string {
		hash, _ := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)
		return string(hash)
	}

	// Create only the Super Admin account — no demo residents or fake staff
	admin := models.User{
		Username:     "admin",
		Email:        "admin@barangay.gov",
		PasswordHash: hashPassword("Admin@2026!"),
		Role:         "Super Admin",
		IsVerified:   true,
	}
	if err := db.Create(&admin).Error; err != nil {
		return err
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

	log.Println("Initial Super Admin account seeded successfully.")
	log.Println("  Username: admin")
	log.Println("  Email:    admin@barangay.gov")
	log.Println("  Password: Admin@2026!")
	log.Println("  Role:     Super Admin")
	log.Println("IMPORTANT: Change the default password after first login!")
	return nil
}
