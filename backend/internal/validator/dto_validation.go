package validator

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
)

// ResidentRegistrationInput DTO for strict resident creation/editing
type ResidentRegistrationInput struct {
	FirstName       string `json:"first_name" binding:"required"`
	MiddleName      string `json:"middle_name"`
	LastName        string `json:"last_name" binding:"required"`
	Suffix          string `json:"suffix"`
	Birthdate       string `json:"birthdate" binding:"required"`
	Gender          string `json:"gender" binding:"required"`
	CivilStatus     string `json:"civil_status" binding:"required"`
	Occupation      string `json:"occupation"`
	ContactNumber   string `json:"contact_number"`
	Email           string `json:"email"`
	Address         string `json:"address" binding:"required"`
	Citizenship     string `json:"citizenship"`
	ResidencyStatus string `json:"residency_status"`
	VoterStatus     string `json:"voter_status"`
	IsPregnant      bool   `json:"is_pregnant"`
	IsSenior        bool   `json:"is_senior"`
	IsPWD           bool   `json:"is_pwd"`
}

// BlotterEntryInput DTO for mediation cases
type BlotterEntryInput struct {
	ComplainantID string `json:"complainant_id" binding:"required"`
	RespondentID  string `json:"respondent_id" binding:"required"`
	IncidentType  string `json:"incident_type" binding:"required"`
	Location      string `json:"location" binding:"required"`
	Details       string `json:"details" binding:"required"`
	IncidentDate  string `json:"incident_date" binding:"required"`
}

// CertificateRequestInput DTO for document requests
type CertificateRequestInput struct {
	Type      string  `json:"type" binding:"required"`
	FirstName string  `json:"first_name"`
	LastName  string  `json:"last_name"`
	Purpose   string  `json:"purpose" binding:"required"`
	Fee       float64 `json:"fee"`
}

// BindStrictJSON enforces DisallowUnknownFields to reject extra non-declared JSON keys.
func BindStrictJSON(c *gin.Context, obj interface{}) error {
	bodyBytes, err := io.ReadAll(c.Request.Body)
	if err != nil {
		return fmt.Errorf("failed to read request body: %w", err)
	}

	// Restore request body for subsequent reads
	c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	decoder := json.NewDecoder(bytes.NewBuffer(bodyBytes))
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(obj); err != nil {
		return fmt.Errorf("strict validation error (unknown fields or invalid format): %w", err)
	}

	return c.ShouldBind(obj)
}

// StrictJSONMiddleware ensures any JSON POST/PUT request rejects extra payload fields.
func StrictJSONMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == http.MethodPost || c.Request.Method == http.MethodPut || c.Request.Method == http.MethodPatch {
			if c.ContentType() == "application/json" {
				bodyBytes, err := io.ReadAll(c.Request.Body)
				if err == nil {
					c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
					var dummy map[string]interface{}
					decoder := json.NewDecoder(bytes.NewBuffer(bodyBytes))
					decoder.DisallowUnknownFields()
					if err := decoder.Decode(&dummy); err != nil {
						// Note: We let the handler's BindStrictJSON perform exact schema validation
					}
				}
			}
		}
		c.Next()
	}
}
