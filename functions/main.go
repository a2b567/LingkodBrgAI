package functions

import (
	"net/http"
	"backend"
)

// api is the entry point for the Firebase Cloud Function
func api(w http.ResponseWriter, r *http.Request) {
	// Use GetHandler which ensures DB and Firebase are initialized
	router := backend.GetHandler()
	
	// Serve the HTTP request using the Gin engine
	router.ServeHTTP(w, r)
}
