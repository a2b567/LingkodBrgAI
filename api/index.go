package api

import (
	"net/http"
	"backend"
)

var router http.Handler

func init() {
	// Initialize the Gin router via the exported function
	router = backend.GetHandler()
}

// Handler is the entry point for Vercel Serverless Functions
func Handler(w http.ResponseWriter, r *http.Request) {
	router.ServeHTTP(w, r)
}
