package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"backend/internal/config"
	"backend/internal/models"
	"github.com/google/uuid"
)

type AIService struct{}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatCompletionRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
}

type ChatCompletionResponse struct {
	Choices []struct {
		Message Message `json:"message"`
	} `json:"choices"`
	Usage struct {
		TotalTokens int `json:"total_tokens"`
	} `json:"usage"`
}

func (s *AIService) ProcessQuery(prompt string, userRole string, userID *uuid.UUID) (string, int, error) {
	db := config.DB
	cfg := config.LoadConfig()

	// 1. Gather context data based on GORM tools that are role-appropriate
	contextData := ""
	lowerPrompt := strings.ToLower(prompt)

	// Admin/Staff search keywords
	isStaff := userRole != "Resident"

	// Fetch data depending on prompt keywords to feed to LLM context
	if isStaff {
		if strings.Contains(lowerPrompt, "unpaid") || strings.Contains(lowerPrompt, "fee") {
			var unpaidCerts []models.Certificate
			db.Preload("Resident").Where("payment_status = ?", "Unpaid").Limit(10).Find(&unpaidCerts)
			contextData += "UNPAID DOCUMENT FEE RECORDS:\n"
			for _, c := range unpaidCerts {
				contextData += fmt.Sprintf("- Doc: %s, Type: %s, Resident: %s %s, Fee: PHP %.2f\n", 
					c.DocumentNumber, c.Type, c.Resident.FirstName, c.Resident.LastName, c.Fee)
			}
		}

		if strings.Contains(lowerPrompt, "senior") || strings.Contains(lowerPrompt, "elder") {
			var seniors []models.Resident
			seniorBday := time.Now().AddDate(-60, 0, 0)
			db.Where("birthdate <= ?", seniorBday).Limit(10).Find(&seniors)
			contextData += "SENIOR CITIZENS REGISTRY:\n"
			for _, r := range seniors {
				contextData += fmt.Sprintf("- Name: %s %s, Birthdate: %s, Address: %s, Contact: %s\n", 
					r.FirstName, r.LastName, r.Birthdate.Format("2006-01-02"), r.Address, r.ContactNumber)
			}
		}

		if strings.Contains(lowerPrompt, "indigent") || strings.Contains(lowerPrompt, "poor") {
			var indigentHouseholds []models.Household
			db.Preload("Head").Where("poverty_level = ?", "Indigent").Limit(10).Find(&indigentHouseholds)
			contextData += "INDIGENT HOUSEHOLDS:\n"
			for _, h := range indigentHouseholds {
				headName := "None"
				if h.Head != nil {
					headName = h.Head.FirstName + " " + h.Head.LastName
				}
				contextData += fmt.Sprintf("- Household No: %s, Head: %s, Address: %s\n", 
					h.HouseholdNumber, headName, h.Address)
			}
		}

		if strings.Contains(lowerPrompt, "incident") || strings.Contains(lowerPrompt, "blotter") || strings.Contains(lowerPrompt, "case") {
			var cases []models.Blotter
			db.Limit(10).Find(&cases)
			contextData += "BLOTTER CASES:\n"
			for _, c := range cases {
				contextData += fmt.Sprintf("- Case No: %s, Complainant: %s, Respondent: %s, Status: %s, Details: %s\n", 
					c.CaseNumber, c.Complainant, c.Respondent, c.Status, c.Details)
			}
		}
	} else {
		// Standard Resident constraints (only sees their own details)
		if userID != nil {
			var user models.User
			if err := db.Preload("Resident").First(&user, "id = ?", userID).Error; err == nil && user.ResidentID != nil {
				contextData += fmt.Sprintf("CURRENT LOGGED-IN RESIDENT CONTEXT:\n- Name: %s %s\n- Birthdate: %s\n- Address: %s\n- Voter Status: %s\n",
					user.Resident.FirstName, user.Resident.LastName, user.Resident.Birthdate.Format("2006-01-02"), user.Resident.Address, user.Resident.VoterStatus)
				
				var personalCerts []models.Certificate
				db.Where("resident_id = ?", user.ResidentID).Limit(5).Find(&personalCerts)
				contextData += "YOUR REQUESTED DOCUMENTS:\n"
				for _, c := range personalCerts {
					contextData += fmt.Sprintf("- Doc: %s, Type: %s, Status: %s, Fee: PHP %.2f, Payment: %s\n",
						c.DocumentNumber, c.Type, c.Status, c.Fee, c.PaymentStatus)
				}
			}
		}
	}

	// Dynamic Congestion prediction context for calendar inquiries
	if strings.Contains(lowerPrompt, "appointment") || strings.Contains(lowerPrompt, "schedule") || strings.Contains(lowerPrompt, "congestion") {
		var dailyBookings []struct {
			Date  time.Time
			Count int64
		}
		db.Model(&models.Appointment{}).
			Select("DATE(appointment_date) as date, COUNT(*) as count").
			Group("DATE(appointment_date)").
			Order("date asc").
			Scan(&dailyBookings)
		contextData += "UPCOMING APPOINTMENTS QUEUES:\n"
		for _, dbg := range dailyBookings {
			contextData += fmt.Sprintf("- Date: %s, Current Bookings: %d\n", dbg.Date.Format("2006-01-02"), dbg.Count)
		}
	}

	// 2. Execute OpenAI completion or Fallback to Simulated AI
	if cfg.OpenAIKey == "" {
		return s.fallbackLocalAI(prompt, userRole, contextData)
	}

	systemInstruction := fmt.Sprintf("You are the official Barangay Management System AI Assistant of Barangay Lawrence. You help users query the community records. The user asking has the role: '%s'. Ensure you check role restrictions before displaying info. If data is missing from context, answer based on general knowledge or ask them to clarify.", userRole)
	if contextData != "" {
		systemInstruction += "\n\nUse the following real-time database query results to answer the user's question accurately:\n" + contextData
	}

	reqBody := ChatCompletionRequest{
		Model: "gpt-4o-mini",
		Messages: []Message{
			{Role: "system", Content: systemInstruction},
			{Role: "user", Content: prompt},
		},
	}

	jsonData, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+cfg.OpenAIKey)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("AI Request failed: %v, calling local mock fallback", err)
		return s.fallbackLocalAI(prompt, userRole, contextData)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBytes, _ := io.ReadAll(resp.Body)
		log.Printf("OpenAI API error status: %d. Details: %s. Using local fallback.", resp.StatusCode, string(respBytes))
		return s.fallbackLocalAI(prompt, userRole, contextData)
	}

	var chatResp ChatCompletionResponse
	if err := json.NewDecoder(resp.Body).Decode(&chatResp); err != nil {
		return "", 0, err
	}

	if len(chatResp.Choices) > 0 {
		return chatResp.Choices[0].Message.Content, chatResp.Usage.TotalTokens, nil
	}

	return "No response from AI agent.", 0, nil
}

func (s *AIService) fallbackLocalAI(prompt, role, contextData string) (string, int, error) {
	lowerPrompt := strings.ToLower(prompt)
	var sb strings.Builder

	sb.WriteString("[Brgy. Lawrence Local AI Assistant - Offline Sandbox Mode]\n\n")

	isStaff := role != "Resident"

	if strings.Contains(lowerPrompt, "hello") || strings.Contains(lowerPrompt, "hi") {
		sb.WriteString("Hello! I am your Barangay Lawrence Virtual Assistant. How can I help you manage community profiles, certificates, blotters, or appointments today?")
	} else if !isStaff && (strings.Contains(lowerPrompt, "unpaid") || strings.Contains(lowerPrompt, "fee") || strings.Contains(lowerPrompt, "blotter") || strings.Contains(lowerPrompt, "senior")) {
		sb.WriteString("I am sorry, but as a Resident user, you do not have administrative privileges to view community-wide financial, incident, or senior citizen registries. You can request your own certificates or schedule appointments.")
	} else if strings.Contains(lowerPrompt, "unpaid") || strings.Contains(lowerPrompt, "fee") {
		if contextData == "" {
			sb.WriteString("There are no unpaid document fee records currently in the system.")
		} else {
			sb.WriteString("Here are the residents with outstanding/unpaid document fees:\n")
			sb.WriteString(contextData)
			sb.WriteString("\nYou can direct them to the Barangay Treasurer for payment updates.")
		}
	} else if strings.Contains(lowerPrompt, "senior") || strings.Contains(lowerPrompt, "elder") {
		if contextData == "" {
			sb.WriteString("I couldn't find any residents aged 60 or older registered in the system.")
		} else {
			sb.WriteString("Here are the senior citizens currently registered in Barangay Lawrence:\n")
			sb.WriteString(contextData)
		}
	} else if strings.Contains(lowerPrompt, "indigent") || strings.Contains(lowerPrompt, "poor") {
		if contextData == "" {
			sb.WriteString("There are no households classified under the indigent bracket in our records.")
		} else {
			sb.WriteString("The following households are marked under the Indigent poverty status:\n")
			sb.WriteString(contextData)
		}
	} else if strings.Contains(lowerPrompt, "incident") || strings.Contains(lowerPrompt, "blotter") || strings.Contains(lowerPrompt, "case") {
		if contextData == "" {
			sb.WriteString("No active blotter cases were found.")
		} else {
			sb.WriteString("Here is a summary of recent blotter incidents in the barangay:\n")
			sb.WriteString(contextData)
		}
	} else if strings.Contains(lowerPrompt, "appointment") || strings.Contains(lowerPrompt, "schedule") || strings.Contains(lowerPrompt, "congestion") {
		if contextData == "" {
			sb.WriteString("There are no upcoming appointments scheduled in the next few days. The scheduling queue is completely clear!")
		} else {
			sb.WriteString("Here is the appointments queue congestion analysis:\n")
			sb.WriteString(contextData)
			sb.WriteString("\nGreen: <8, Yellow: 8-20, Red: >20 daily bookings. Congestion risk is currently low.")
		}
	} else {
		sb.WriteString("I received your prompt: \"")
		sb.WriteString(prompt)
		sb.WriteString("\".\nTo request database listings, try queries including: 'unpaid fees', 'senior citizens', 'indigent households', 'blotter cases', or 'appointment congestion'.")
	}

	return sb.String(), len(prompt) / 4, nil
}
