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

	// Clean transactional and demo tables (preserve users & licenses)
	db.Exec("DELETE FROM certificates")
	db.Exec("DELETE FROM blotters")
	db.Exec("DELETE FROM businesses")
	db.Exec("DELETE FROM appointments")
	db.Exec("DELETE FROM dispensed_items")
	db.Exec("DELETE FROM health_records")
	db.Exec("DELETE FROM medicine_stocks")
	db.Exec("DELETE FROM notifications")
	db.Exec("DELETE FROM payments")
	db.Exec("DELETE FROM queue_tickets")
	db.Exec("DELETE FROM households")
	db.Exec("DELETE FROM residents")
	db.Exec("DELETE FROM audit_logs")
	db.Exec("DELETE FROM ai_logs")

	fmt.Printf("Cleaned operational tables in %s successfully.\n", name)

	// Seed clean default medicine inventory
	defaultStock := []models.MedicineStock{
		{Name: "Paracetamol (Biogesic 500mg)", Category: "Analgesic", Stock: 120, Unit: "tablets", MinStock: 20},
		{Name: "Amoxicillin 500mg", Category: "Antibiotic", Stock: 12, Unit: "capsules", MinStock: 15},
		{Name: "Vitamin C (Ascorbic Acid)", Category: "Supplement", Stock: 200, Unit: "tablets", MinStock: 30},
		{Name: "Flu Vaccine (Influenza)", Category: "Vaccine", Stock: 4, Unit: "vials", MinStock: 5},
		{Name: "Losartan 50mg", Category: "Antihypertensive", Stock: 85, Unit: "tablets", MinStock: 10},
		{Name: "Cetirizine 10mg", Category: "Antihistamine", Stock: 45, Unit: "tablets", MinStock: 10},
	}

	for _, stock := range defaultStock {
		db.Create(&stock)
	}
	fmt.Printf("Seeded clean default medicine inventory in %s.\n", name)
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

	// 2. Ensure all 5 default staff accounts & licenses are intact and updated
	if err := config.SeedDatabase(db); err != nil {
		log.Printf("SeedDatabase warning: %v", err)
	}

	// 3. Print verified staff users in database
	var staffUsers []models.User
	db.Find(&staffUsers)
	fmt.Printf("\n--- Verified Active Database Staff Accounts (%d Users) ---\n", len(staffUsers))
	for _, u := range staffUsers {
		fmt.Printf("✓ User: %-15s | Role: %-20s | Verified: %v\n", u.Username, u.Role, u.IsVerified)
	}

	fmt.Println("\nAll database operational data cleaned & default staff accounts verified!")
}
