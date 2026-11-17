package api

import (
	"net/http"
	"backend"
)

// Handler is the entry point for Vercel Serverless Functions
func Handler(w http.ResponseWriter, r *http.Request) {
	backend.GetHandler().ServeHTTP(w, r)
}
