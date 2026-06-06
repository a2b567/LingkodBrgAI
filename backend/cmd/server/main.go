package main

import (
	"log"
	"net/http"
	"os"

	"backend/internal/config"
	"backend/internal/routes"
	"backend/internal/services"
)

func main() {
	log.Println("Starting Barangay Management Information System (BMIS) Backend...")

	// 1. Load configuration
	cfg := config.LoadConfig()

	// 2. Initialize Database (Retry inside InitDB)
	db, err := config.InitDB(cfg)
	if err != nil {
		log.Fatalf("Database initialization failed: %v", err)
	}

	// 3. Seed Database
	if err := config.SeedDatabase(db); err != nil {
		log.Printf("Warning: Seeding database failed: %v", err)
	}

	// 4. Initialize WebSocket Notification Hub
	services.InitHub()

	// Create uploads directories to prevent server write errors
	os.MkdirAll("./uploads/photos", os.ModePerm)
	os.MkdirAll("./uploads/certificates", os.ModePerm)
	os.MkdirAll("./uploads/qr", os.ModePerm)

	// 5. Setup Router
	r := routes.SetupRouter()

	// 6. Start server
	log.Printf("Server is running on port %s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
