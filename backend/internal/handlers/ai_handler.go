package handlers

import (
	"net/http"

	"backend/internal/config"
	"backend/internal/models"
	"backend/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AIHandler struct {
	aiService services.AIService
}

type AIChatRequest struct {
	Prompt string `json:"prompt" binding:"required"`
}

func (h *AIHandler) Chat(c *gin.Context) {
	var req AIChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userRoleVal, _ := c.Get("role")
	userRole, _ := userRoleVal.(string)

	userIDVal, _ := c.Get("userID")
	var logUserID *uuid.UUID
	if userIDVal != nil {
		uid := userIDVal.(uuid.UUID)
		logUserID = &uid
	}

	// Call AI service
	response, tokens, err := h.aiService.ProcessQuery(req.Prompt, userRole, logUserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Log interaction to DB
	db := config.DB
	db.Create(&models.AILog{
		UserID:     logUserID,
		Prompt:     req.Prompt,
		Response:   response,
		TokensUsed: tokens,
	})

	c.JSON(http.StatusOK, gin.H{
		"response": response,
	})
}

func (h *AIHandler) SummarizeCase(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	db := config.DB
	var kase models.Blotter
	if err := db.First(&kase, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Case not found"})
		return
	}

	prompt := "Please write a concise 2-3 sentence summary of the following dispute: " + kase.Details
	response, _, err := h.aiService.ProcessQuery(prompt, "Secretary", nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate summary"})
		return
	}

	// Save summary back to DB
	kase.AISummary = response
	db.Save(&kase)

	c.JSON(http.StatusOK, gin.H{
		"summary": response,
	})
}
