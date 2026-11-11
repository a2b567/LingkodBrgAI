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
		{
			Username:     "lawrence",
			Email:        "lawrencebelenaranas123@gmail.com",
			PasswordHash: hashPassword("Lawrence@2026!"),
			Role:         "Resident",
			IsVerified:   true,
		},
	}

	for _, u := range defaultUsers {
		var existingUser models.User
		err := db.Select("id").Where("username = ?", u.Username).First(&existingUser).Error
		if err != nil {
			if err := db.Create(&u).Error; err != nil {
				log.Printf("Failed to seed user %s: %v", u.Username, err)
			} else {
				log.Printf("Seeded default account: %s (%s)", u.Username, u.Role)
			}
		}
		// Skip redundant UPDATE if user already exists (saves 6+ seconds of Supabase network round-trips)
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

	// Ensure resident profile exists for lawrence
	var lawrenceUser models.User
	if err := db.Where("username = ?", "lawrence").First(&lawrenceUser).Error; err == nil && lawrenceUser.ResidentID == nil {
		lawrenceResident := models.Resident{
			FirstName:       "Lawrence",
			LastName:        "Aranas",
			MiddleName:      "Belen",
			Birthdate:       time.Date(2000, 1, 1, 0, 0, 0, 0, time.UTC),
			Gender:          "Male",
			CivilStatus:     "Single",
			Address:         "Purok 1, Barangay San Isidro, Bay, Laguna",
			Citizenship:     "Filipino",
			ResidencyStatus: "Permanent",
			VoterStatus:     "Registered",
			Email:           "lawrencebelenaranas123@gmail.com",
			QRID:            "QR-RES-LAWRENCE",
		}
		if err := db.Create(&lawrenceResident).Error; err == nil {
			db.Model(&lawrenceUser).Update("resident_id", lawrenceResident.ID)
		}
	}

	return nil
}
