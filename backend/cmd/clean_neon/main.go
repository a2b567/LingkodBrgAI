package main

import (
	"fmt"
	"log"
	"os"

	"backend/internal/config"
	"backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgresql://neondb_owner:npg_RbzfroaQU16T@ep-rough-silence-at6p665q-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require"
	}

	db, err := gorm.Open(postgres.Open(dbURL), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to Neon DB: %v", err)
	}

	fmt.Println("--- Connected to Neon PostgreSQL Database ---")

	// Ensure all tables exist first
	_ = db.AutoMigrate(
		&models.Household{},
		&models.Resident{},
		&models.User{},
		&models.Certificate{},
		&models.Blotter{},
		&models.Business{},
		&models.Appointment{},
		&models.Notification{},
		&models.Payment{},
		&models.AuditLog{},
		&models.AILog{},
		&models.QueueTicket{},
		&models.License{},
		&models.MedicineStock{},
		&models.HealthRecord{},
		&models.DispensedItem{},
	)

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
			fmt.Printf("Error wiping %s: %v\n", table, res.Error)
		} else {
			fmt.Printf("✓ Wiped %-20s -> %d rows deleted\n", table, res.RowsAffected)
		}
	}

	// Delete non-staff users
	resUser := db.Exec("DELETE FROM users WHERE role = 'Resident' OR (role NOT IN ('Super Admin', 'Barangay Captain', 'Secretary', 'Health Worker', 'Treasurer', 'Staff', 'Admin') AND username NOT IN ('admin', 'captain', 'secretary', 'healthworker', 'treasurer'))")
	if resUser.Error != nil {
		fmt.Printf("Error wiping non-staff users: %v\n", resUser.Error)
	} else {
		fmt.Printf("✓ Wiped non-staff users -> %d rows deleted\n", resUser.RowsAffected)
	}

	// Re-seed staff accounts and active license
	config.SeedDatabase(db)

	var staffUsers []models.User
	db.Find(&staffUsers)
	fmt.Printf("\n--- Verified Active Staff Accounts (%d Users) ---\n", len(staffUsers))
	for _, u := range staffUsers {
		fmt.Printf("✓ User: %-15s | Role: %-20s | Verified: %v\n", u.Username, u.Role, u.IsVerified)
	}

	fmt.Println("\nNeon PostgreSQL operational data completely wiped! Staff accounts verified.")
}
