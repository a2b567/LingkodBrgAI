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

	// Clean transactional and demo tables
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
	db.Exec("DELETE FROM audit_logs")
	db.Exec("DELETE FROM ai_logs")

	// Delete test residents created during test runs (preserve default system residents if any)
	db.Where("first_name LIKE ? OR first_name LIKE ?", "%Test%", "%Maria Clara%").Delete(&models.Resident{})

	fmt.Printf("Cleaned tables in %s successfully.\n", name)
}

func main() {
	cfg := config.LoadConfig()
	db, err := config.InitDB(cfg)
	if err != nil {
		log.Fatalf("InitDB error: %v", err)
	}

	cleanDB(db, "Primary DB")
	if config.CloudDB != nil && config.CloudDB != db {
		cleanDB(config.CloudDB, "Cloud DB")
	}

	fmt.Println("\nAll demo and test data removed successfully from databases!")
}
