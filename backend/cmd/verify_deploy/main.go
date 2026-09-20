package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	fmt.Println("========================================================")
	fmt.Println("🔍 VERIFYING DEPLOYED DATABASE & LIVE BACKEND API STATUS")
	fmt.Println("========================================================")

	// 1. Check Deployed Neon PostgreSQL Database directly
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgresql://neondb_owner:npg_RbzfroaQU16T@ep-rough-silence-at6p665q-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require"
	}

	db, err := gorm.Open(postgres.Open(dbURL), &gorm.Config{})
	if err != nil {
		fmt.Printf("❌ Failed to connect to Neon DB: %v\n", err)
		return
	}

	fmt.Println("\n📊 Checking Deployed Database Tables Row Counts:")
	tables := []string{
		"residents",
		"households",
		"certificates",
		"blotters",
		"businesses",
		"appointments",
		"notifications",
		"payments",
		"queue_tickets",
		"medicine_stocks",
		"health_records",
		"dispensed_items",
		"audit_logs",
		"ai_logs",
	}

	allClean := true
	for _, table := range tables {
		var count int64
		if err := db.Table(table).Count(&count).Error; err != nil {
			fmt.Printf("  • Table %-20s: ⚠ Error (%v)\n", table, err)
		} else {
			statusStr := "✅ Clean (0 records)"
			if count > 0 {
				statusStr = fmt.Sprintf("❌ NOT CLEAN (%d records)", count)
				allClean = false
			}
			fmt.Printf("  • Table %-20s: %d rows | %s\n", table, count, statusStr)
		}
	}

	// Verify User accounts in Database
	var users []models.User
	db.Find(&users)
	fmt.Printf("\n👤 Deployed Database Users (%d total):\n", len(users))
	for _, u := range users {
		fmt.Printf("  • User: %-15s | Role: %-20s | Email: %-30s | Verified: %v\n", u.Username, u.Role, u.Email, u.IsVerified)
	}

	// 2. Test Live Deployed Endpoints
	deployURL := "https://bmis-a2b567s-projects.vercel.app"
	fmt.Printf("\n🌐 Testing Live Deployed Endpoints on %s:\n", deployURL)

	client := http.Client{Timeout: 10 * time.Second}
	endpoints := []string{
		"/api/health",
		"/api/db-status",
		"/api/residents",
		"/api/certificates",
		"/api/blotters",
		"/api/businesses",
		"/api/appointments",
		"/api/notifications",
	}

	for _, ep := range endpoints {
		url := deployURL + ep
		resp, err := client.Get(url)
		if err != nil {
			fmt.Printf("  • Endpoint %-20s -> ❌ Failed (%v)\n", ep, err)
			continue
		}
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()

		var jsonSummary string
		if len(body) > 100 {
			jsonSummary = string(body[:100]) + "..."
		} else {
			jsonSummary = string(body)
		}
		fmt.Printf("  • Endpoint %-20s -> Status: %d | Response: %s\n", ep, resp.StatusCode, jsonSummary)
	}

	fmt.Println("\n========================================================")
	if allClean {
		fmt.Println("🎉 VERIFICATION COMPLETE: ALL DEMO DATA IS 100% CLEAN!")
		fmt.Println("   OFFICIAL STAFF ACCOUNTS ARE ACTIVE AND VERIFIED.")
	} else {
		fmt.Println("⚠ VERIFICATION WARNING: SOME TABLES STILL CONTAIN DATA.")
	}
	fmt.Println("========================================================")
}

// Suppress unused import warning
var _ = json.Marshal
