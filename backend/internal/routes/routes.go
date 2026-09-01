package routes

import (
	"net/http"
	"time"

	"backend/internal/handlers"
	"backend/internal/middleware"
	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	// Apply CORS
	r.Use(middleware.CORSMiddleware())

	// Global Rate Limiting: Max 120 requests per minute per IP
	r.Use(middleware.RateLimitMiddleware(120, time.Minute))

	// Serve Static files for uploads (photos, certificates, etc.)
	r.Static("/uploads", "./uploads")

	// Handlers Init
	authHandler := &handlers.AuthHandler{}
	resHandler := &handlers.ResidentHandler{}
	houseHandler := &handlers.HouseholdHandler{}
	certHandler := &handlers.CertificateHandler{}
	blotterHandler := &handlers.BlotterHandler{}
	bizHandler := &handlers.BusinessHandler{}
	appHandler := &handlers.AppointmentHandler{}
	notifHandler := &handlers.NotificationHandler{}
	payHandler := &handlers.PaymentHandler{}
	aiHandler := &handlers.AIHandler{}
	analyticsHandler := &handlers.AnalyticsHandler{}

	// Public Routes
	api := r.Group("/api")
	{
		api.GET("/ping", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "pong"})
		})

		// Auth (Strict Rate Limiting: Max 10 requests per minute for login/register/reset)
		auth := api.Group("/auth")
		auth.Use(middleware.RateLimitMiddleware(10, time.Minute))
		{
			auth.POST("/login", authHandler.Login)
			auth.POST("/register", authHandler.Register)
			auth.POST("/verify-otp", authHandler.VerifyOTP)
			auth.POST("/forgot-password", authHandler.ForgotPassword)
			auth.POST("/reset-password", authHandler.ResetPassword)
		}

		// Public Verification (QR Scanner landing page)
		api.GET("/verify/document/:hash", certHandler.VerifyQR)

		// Public Kiosk Request
		api.POST("/public/certificates/request", certHandler.PublicRequest)

		// WebSockets for live updates
		api.GET("/ws", notifHandler.WebSocketEndpoint)
	}

	// Protected Routes (Required Authenticated User)
	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware())
	{
		// Auth profile info
		protected.GET("/auth/me", authHandler.GetMe)

		// Notifications
		protected.GET("/notifications", notifHandler.List)
		protected.PATCH("/notifications/:id/read", notifHandler.Read)

		// AI Chat panel (Rate limited to 15 messages per minute to preserve AI quota)
		protected.POST("/ai/chat", middleware.RateLimitMiddleware(15, time.Minute), aiHandler.Chat)

		// Appointments (Residents & Staff)
		protected.GET("/appointments", appHandler.List)
		protected.POST("/appointments", appHandler.Book)
		protected.PUT("/appointments/:id/status", appHandler.UpdateStatus)
		protected.GET("/appointments/congestion", appHandler.PredictCongestion)

		// Certificates requesting (Residents & Staff)
		protected.GET("/certificates", certHandler.List)
		protected.POST("/certificates", certHandler.Request)
		protected.GET("/certificates/:id", certHandler.Get)

		// Staff & Admins Only endpoints
		staffOnly := protected.Group("")
		staffOnly.Use(middleware.RequireRoles(
			"Super Admin", 
			"Barangay Captain", 
			"Secretary", 
			"Treasurer", 
			"Health Worker", 
			"Staff",
		))
		{
			// Resident Management
			staffOnly.GET("/residents", resHandler.List)
			staffOnly.POST("/residents", resHandler.Create)
			staffOnly.GET("/residents/:id", resHandler.Get)
			staffOnly.PUT("/residents/:id", resHandler.Update)
			staffOnly.DELETE("/residents/:id", resHandler.Delete)
			staffOnly.POST("/residents/upload-photo", resHandler.UploadPhoto)

			// Household Management
			staffOnly.GET("/households", houseHandler.List)
			staffOnly.POST("/households", houseHandler.Create)
			staffOnly.GET("/households/:id", houseHandler.Get)
			staffOnly.PUT("/households/:id", houseHandler.Update)
			staffOnly.DELETE("/households/:id", houseHandler.Delete)
			staffOnly.POST("/households/assign-member", houseHandler.AssignMember)

			// Blotter Incident reports
			staffOnly.GET("/blotters", blotterHandler.List)
			staffOnly.POST("/blotters", blotterHandler.Create)
			staffOnly.GET("/blotters/:id", blotterHandler.Get)
			staffOnly.PUT("/blotters/:id", blotterHandler.Update)
			staffOnly.DELETE("/blotters/:id", blotterHandler.Delete)
			staffOnly.POST("/blotters/:id/summarize", aiHandler.SummarizeCase)

			// Business Clearance
			staffOnly.GET("/businesses", bizHandler.List)
			staffOnly.POST("/businesses", bizHandler.Create)
			staffOnly.GET("/businesses/:id", bizHandler.Get)
			staffOnly.PUT("/businesses/:id", bizHandler.Update)
			staffOnly.DELETE("/businesses/:id", bizHandler.Delete)

			// Documents Approval
			staffOnly.POST("/certificates/:id/approve", certHandler.Approve)
			staffOnly.POST("/certificates/:id/reject", certHandler.Reject)

			// Payment Ledgers
			staffOnly.GET("/payments", payHandler.List)
			staffOnly.GET("/payments/:id", payHandler.Get)

			// Announcements creation
			staffOnly.POST("/announcements", notifHandler.CreateAnnouncement)

			// Dashboards
			staffOnly.GET("/analytics/dashboard", analyticsHandler.GetStats)
		}
	}

	return r
}
