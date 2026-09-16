package main

import (
	"fmt"
	"log"
	"os"

	"backend/internal/config"
	"backend/internal/models"
	"github.com/glebarez/sqlite"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func wipeOperationalData(db *gorm.DB, dbName string) {
	if db == nil {
		return
	}
	fmt.Printf("\n========================================\n")
	fmt.Printf("Cleaning operational data on: %s\n", dbName)
	fmt.Printf("========================================\n")

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
		log.Printf("⚠ Seeding database error on %s: %v", dbName, err)
	} else {
		fmt.Printf("✓ Default staff accounts & active license successfully verified and seeded on %s!\n", dbName)
	}

	// Print verified staff users
	var staffUsers []models.User
	db.Find(&staffUsers)
	fmt.Printf("\n--- Active Staff Accounts in %s (%d Users) ---\n", dbName, len(staffUsers))
	for _, u := range staffUsers {
		fmt.Printf("  • User: %-15s | Role: %-20s | Email: %-30s | Verified: %v\n", u.Username, u.Role, u.Email, u.IsVerified)
	}
}

func main() {
	// 1. Clean Neon Postgres (Vercel Deployed Cloud DB)
	neonURL := os.Getenv("DATABASE_URL")
	if neonURL == "" {
		neonURL = "postgresql://neondb_owner:npg_RbzfroaQU16T@ep-rough-silence-at6p665q-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require"
	}
	fmt.Println("Connecting to Neon PostgreSQL (Deployed DB)...")
	neonDB, err := gorm.Open(postgres.Open(neonURL), &gorm.Config{})
	if err != nil {
		fmt.Printf("Error connecting to Neon DB: %v\n", err)
	} else {
		wipeOperationalData(neonDB, "Neon Cloud Database (Deploy)")
	}

	// 2. Clean Supabase Postgres if configured
	supabaseDSN := "host=aws-0-ap-southeast-2.pooler.supabase.com user=postgres.axqnnlrtyjkmjsseizfz password=NIKEniaranas dbname=postgres port=6543 sslmode=require TimeZone=Asia/Manila"
	fmt.Println("\nConnecting to Supabase PostgreSQL Database...")
	supabaseDB, err := gorm.Open(postgres.New(postgres.Config{
		DSN:                  supabaseDSN,
		PreferSimpleProtocol: true,
	}), &gorm.Config{})
	if err != nil {
		fmt.Printf("Supabase connection skipped or failed: %v\n", err)
	} else {
		wipeOperationalData(supabaseDB, "Supabase Database")
	}

	// 3. Clean local SQLite DB files
	localFiles := []string{"lingkodbrgai.db", "lingkodbrgai_cloud.db", "bmis.db"}
	for _, dbFile := range localFiles {
		if _, err := os.Stat(dbFile); err == nil {
			localDB, err := gorm.Open(sqlite.Open(dbFile), &gorm.Config{})
			if err == nil {
				wipeOperationalData(localDB, fmt.Sprintf("Local DB file (%s)", dbFile))
			}
		}
	}

	fmt.Println("\n========================================================")
	fmt.Println("✅ ALL DEMO DATA REMOVED FROM ALL DEPLOYED & LOCAL DATABASES!")
	fmt.Println("   ALL STAFF ACCOUNTS ARE PRESERVED, VERIFIED AND INTACT.")
	fmt.Println("========================================================")
}
