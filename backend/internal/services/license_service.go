package services

import (
	"crypto/rand"
	"fmt"
	"time"

	"backend/internal/config"
	"backend/internal/models"
)

type LicenseService struct{}

const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

// GenerateRandomGroup generates a cryptographically secure random string of given length using uppercase alphanumeric chars
func generateRandomGroup(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	for i, b := range bytes {
		bytes[i] = charset[b%byte(len(charset))]
	}
	return string(bytes), nil
}

// GenerateFormattedKey generates a license key in the format: LINGKOD-XXXX-XXXX-XXXX
func (s *LicenseService) GenerateFormattedKey() (string, error) {
	g1, err := generateRandomGroup(4)
	if err != nil {
		return "", err
	}
	g2, err := generateRandomGroup(4)
	if err != nil {
		return "", err
	}
	g3, err := generateRandomGroup(4)
	if err != nil {
		return "", err
	}
	g4, err := generateRandomGroup(4)
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("LINGKOD-%s-%s-%s-%s", g1, g2, g3, g4), nil
}

// CreateLicense generates and saves a new license to the database
func (s *LicenseService) CreateLicense(customerName, customerEmail string, maxUsers int, expiryDate *time.Time, isPerpetual bool) (*models.License, error) {
	db := config.DB

	key, err := s.GenerateFormattedKey()
	if err != nil {
		return nil, fmt.Errorf("failed to generate secure key: %w", err)
	}

	if maxUsers <= 0 {
		maxUsers = 10
	}

	license := &models.License{
		LicenseKey:    key,
		CustomerName:  customerName,
		CustomerEmail: customerEmail,
		MaxUsers:      maxUsers,
		IssuedDate:    time.Now(),
		ExpiryDate:    expiryDate,
		IsActive:      true,
		IsPerpetual:   isPerpetual,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if err := db.Create(license).Error; err != nil {
		return nil, fmt.Errorf("failed to save license to database: %w", err)
	}

	// Async sync to secondary cloud DB if active
	config.SyncToCloud(license)

	return license, nil
}

// ValidateLicense checks if a given license key is valid, active, unexpired, and hardware-matched
func (s *LicenseService) ValidateLicense(licenseKey, hardwareID string) (*models.License, bool, string) {
	db := config.DB

	if licenseKey == "" {
		return nil, false, "License key is required."
	}

	var lic models.License
	if err := db.Where("license_key = ?", licenseKey).First(&lic).Error; err != nil {
		return nil, false, "Invalid license key. Key does not exist."
	}

	// 1. Check if active
	if !lic.IsActive {
		return &lic, false, "License has been revoked or deactivated."
	}

	// 2. Check Expiration (if not perpetual)
	if !lic.IsPerpetual && lic.ExpiryDate != nil {
		if time.Now().After(*lic.ExpiryDate) {
			return &lic, false, fmt.Sprintf("License expired on %s.", lic.ExpiryDate.Format("2006-01-02"))
		}
	}

	// 3. Hardware Binding check / Auto-bind
	if hardwareID != "" {
		if lic.HardwareID == "" {
			// Auto-bind hardware ID on first validation
			lic.HardwareID = hardwareID
			db.Model(&lic).Update("hardware_id", hardwareID)
			config.SyncToCloud(&lic)
		} else if lic.HardwareID != hardwareID {
			return &lic, false, "Hardware ID mismatch. This license is bound to another server or domain."
		}
	}

	// 4. Update last_validated timestamp
	now := time.Now()
	lic.LastValidated = &now
	db.Model(&lic).Update("last_validated", now)
	config.SyncToCloud(&lic)

	return &lic, true, "License is valid and active."
}
