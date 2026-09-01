package config

import (
	"log"
	"time"

	"backend/internal/models"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func SeedDatabase(db *gorm.DB) error {
	var userCount int64
	db.Model(&models.User{}).Count(&userCount)
	if userCount > 0 {
		log.Println("Database already seeded. Skipping...")
		return nil
	}

	log.Println("Seeding essential system accounts...")

	// 1. Helper to hash password
	hashPassword := func(pw string) string {
		hash, _ := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)
		return string(hash)
	}

	// 2. Create minimal Residents required for default staff accounts
	r1ID := uuid.New() // Captain Resident
	r2ID := uuid.New() // Treasurer Resident
	r3ID := uuid.New() // Secretary Resident
	r4ID := uuid.New() // Resident User

	parseTime := func(layout, val string) time.Time {
		t, _ := time.Parse(layout, val)
		return t
	}

	residents := []models.Resident{
		{
			Base:            models.Base{ID: r1ID},
			FirstName:       "Juan",
			LastName:        "Dela Cruz",
			Birthdate:       parseTime("2006-01-02", "1975-06-15"),
			Gender:          "Male",
			CivilStatus:     "Married",
			Occupation:      "Public Servant",
			ContactNumber:   "09171234567",
			Email:           "captain@lawrence.gov",
			Address:         "Zone 5, Narra Blvd., Brgy. Lawrence",
			Citizenship:     "Filipino",
			ResidencyStatus: "Permanent",
			VoterStatus:     "Registered",
			QRID:            "QR-RES-0001",
		},
		{
			Base:            models.Base{ID: r2ID},
			FirstName:       "Maria",
			LastName:        "Santos",
			Birthdate:       parseTime("2006-01-02", "1980-08-22"),
			Gender:          "Female",
			CivilStatus:     "Single",
			Occupation:      "Accountant",
			ContactNumber:   "09187654321",
			Email:           "treasurer@lawrence.gov",
			Address:         "Zone 3, Acacia Ave., Brgy. Lawrence",
			Citizenship:     "Filipino",
			ResidencyStatus: "Permanent",
			VoterStatus:     "Registered",
			QRID:            "QR-RES-0002",
		},
		{
			Base:            models.Base{ID: r3ID},
			FirstName:       "Pedro",
			LastName:        "Penduko",
			Birthdate:       parseTime("2006-01-02", "1988-11-03"),
			Gender:          "Male",
			CivilStatus:     "Married",
			Occupation:      "Clerk",
			ContactNumber:   "09191112222",
			Email:           "secretary@lawrence.gov",
			Address:         "Zone 3, Acacia Ave., Brgy. Lawrence",
			Citizenship:     "Filipino",
			ResidencyStatus: "Permanent",
			VoterStatus:     "Registered",
			QRID:            "QR-RES-0003",
		},
		{
			Base:            models.Base{ID: r4ID},
			FirstName:       "Jose",
			LastName:        "Rizal",
			Birthdate:       parseTime("2006-01-02", "1995-12-30"),
			Gender:          "Male",
			CivilStatus:     "Single",
			Occupation:      "Writer",
			ContactNumber:   "09228889999",
			Email:           "resident@lawrence.gov",
			Address:         "Zone 1, Mahogany St., Brgy. Lawrence",
			Citizenship:     "Filipino",
			ResidencyStatus: "Permanent",
			VoterStatus:     "Registered",
			QRID:            "QR-RES-0004",
		},
	}

	for _, r := range residents {
		if err := db.Create(&r).Error; err != nil {
			return err
		}
	}

	// 3. Create Users (with various roles)
	users := []models.User{
		{
			Username:     "admin",
			Email:        "admin@lawrence.gov",
			PasswordHash: hashPassword("password123"),
			Role:         "Super Admin",
			IsVerified:   true,
		},
		{
			Username:     "captain",
			Email:        "captain@lawrence.gov",
			PasswordHash: hashPassword("password123"),
			Role:         "Barangay Captain",
			IsVerified:   true,
			ResidentID:   &r1ID,
		},
		{
			Username:     "treasurer",
			Email:        "treasurer@lawrence.gov",
			PasswordHash: hashPassword("password123"),
			Role:         "Treasurer",
			IsVerified:   true,
			ResidentID:   &r2ID,
		},
		{
			Username:     "secretary",
			Email:        "secretary@lawrence.gov",
			PasswordHash: hashPassword("password123"),
			Role:         "Secretary",
			IsVerified:   true,
			ResidentID:   &r3ID,
		},
		{
			Username:     "healthworker",
			Email:        "healthworker@lawrence.gov",
			PasswordHash: hashPassword("password123"),
			Role:         "Health Worker",
			IsVerified:   true,
		},
		{
			Username:     "staff",
			Email:        "staff@lawrence.gov",
			PasswordHash: hashPassword("password123"),
			Role:         "Staff",
			IsVerified:   true,
		},
		{
			Username:     "resident",
			Email:        "resident@lawrence.gov",
			PasswordHash: hashPassword("password123"),
			Role:         "Resident",
			IsVerified:   true,
			ResidentID:   &r4ID,
		},
	}

	for _, u := range users {
		if err := db.Create(&u).Error; err != nil {
			return err
		}
	}

	log.Println("Essential system accounts seeded successfully.")
	return nil
}
