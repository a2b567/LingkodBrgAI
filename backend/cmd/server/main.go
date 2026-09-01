package main

import (
	"log"
	"net/http"

	"backend/internal/config"
	"backend/internal/routes"
	"backend/internal/services"
)

func main() {
	log.Println("Starting LingkodBrgAI — Barangay Management Information System Backend...")

	// 1. Load configuration
	cfg := config.LoadConfig()

	// Initialize Firebase Storage (non-fatal if credentials are missing)
	if err := config.InitFirebase(); err != nil {
		log.Printf("Firebase init skipped (uploads will fail): %v", err)
	}

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



	// 5. Setup Router
	r := routes.SetupRouter()

	// 6. Start server
	log.Printf("Server is running on port %s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
