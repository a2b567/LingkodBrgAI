package backend

import (
	"log"
	"net/http"
	"sync"

	"backend/internal/config"
	"backend/internal/routes"
	"backend/internal/services"
)

var (
	router http.Handler
	once   sync.Once
)

// initAll initializes all backend dependencies (DB, Firebase, WebSocket hub, etc.)
// It is idempotent thanks to sync.Once.
func initAll() {
	once.Do(func() {
		cfg := config.LoadConfig()

		// Initialize Firebase Storage (non-fatal if missing credentials)
		if err := config.InitFirebase(); err != nil {
			log.Printf("Firebase init skipped: %v", err)
		}

		// Initialize Database
		if _, err := config.InitDB(cfg); err != nil {
			log.Printf("Warning: DB init failed in serverless context: %v", err)
		}

		// Seed Database
		if config.DB != nil {
			if err := config.SeedDatabase(config.DB); err != nil {
				log.Printf("Warning: Seeding database failed: %v", err)
			}
		}

		// Initialize WebSocket Hub
		services.InitHub()

		// Setup Router
		router = routes.SetupRouter()
	})
}

// GetHandler returns the HTTP handler for Vercel serverless functions.
// It ensures all backend services are initialized before returning.
func GetHandler() http.Handler {
	initAll()
	return router
}
