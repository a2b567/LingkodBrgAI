package models

import "time"

type License struct {
	ID            uint       `gorm:"primaryKey;autoIncrement" json:"id"`
	LicenseKey    string     `gorm:"unique;not null;index" json:"license_key"`
	CustomerName  string     `json:"customer_name"`
	CustomerEmail string     `json:"customer_email"`
	MaxUsers      int        `gorm:"default:10" json:"max_users"`
	IssuedDate    time.Time  `json:"issued_date"`
	ExpiryDate    *time.Time `json:"expiry_date"`
	IsActive      bool       `gorm:"default:true" json:"is_active"`
	IsPerpetual   bool       `gorm:"default:false" json:"is_perpetual"`
	HardwareID    string     `json:"hardware_id"`
	LastValidated *time.Time `json:"last_validated"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}
