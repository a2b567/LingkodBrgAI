package main

import (
	"fmt"
	"log"

	"backend/internal/config"
	"backend/internal/models"
	"gorm.io/gorm"
)

func cleanDB(db *gorm.DB, name string) {
	if db == nil {
		return
	}
	fmt.Printf("\n--- Cleaning demo data in %s ---\n", name)

	tables := []string{
		"dispensed_items",
		"health_records",
		"medicine_stocks",
		"queue_tickets",
		"certificates",
		"blotters",
		"businesses",
		"appointments",
		"notifications",
		"payments",
		"households",
		"residents",
		"audit_logs",
		"ai_logs",
	}

	for _, table := range tables {
		res := db.Exec(fmt.Sprintf("DELETE FROM %s", table))
		if res.Error != nil {
			fmt.Printf("⚠ Warning deleting from %s: %v\n", table, res.Error)
		} else {
			fmt.Printf("✓ Cleaned table %-20s -> %d rows deleted\n", table, res.RowsAffected)
		}
	}

	// Remove non-staff user accounts (preserve staff accounts: Super Admin, Barangay Captain, Secretary, Health Worker, Treasurer, Staff, Admin)
	resUser := db.Exec("DELETE FROM users WHERE role = 'Resident' OR (role NOT IN ('Super Admin', 'Barangay Captain', 'Secretary', 'Health Worker', 'Treasurer', 'Staff', 'Admin') AND username NOT IN ('admin', 'captain', 'secretary', 'healthworker', 'treasurer'))")
	if resUser.Error != nil {
		fmt.Printf("⚠ Warning deleting non-staff users: %v\n", resUser.Error)
	} else {
		fmt.Printf("✓ Cleaned non-staff users -> %d rows deleted\n", resUser.RowsAffected)
	}

	// Re-seed default staff accounts and active license
	if err := config.SeedDatabase(db); err != nil {
		log.Printf("⚠ SeedDatabase warning on %s: %v", name, err)
	}

	var staffUsers []models.User
	db.Find(&staffUsers)
	fmt.Printf("\n--- Verified Active Staff Accounts (%d Users) ---\n", len(staffUsers))
	for _, u := range staffUsers {
		fmt.Printf("✓ User: %-15s | Role: %-20s | Verified: %v\n", u.Username, u.Role, u.IsVerified)
	}
}

func main() {
	cfg := config.LoadConfig()
	db, err := config.InitDB(cfg)
	if err != nil {
		log.Fatalf("InitDB error: %v", err)
	}

	// 1. Clean operational tables
	cleanDB(db, "Primary DB")
	if config.CloudDB != nil && config.CloudDB != db {
		cleanDB(config.CloudDB, "Cloud DB")
	}

	fmt.Println("\nAll database operational data cleaned & default staff accounts verified!")
}
