package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func main() {
	baseURL := "https://lingkodbrgyai.vercel.app/api"
	
	// 1. Login
	loginPayload := map[string]string{
		"username": "captain",
		"password": "Captain@2026!",
	}
	body, _ := json.Marshal(loginPayload)
	resp, err := http.Post(baseURL+"/auth/login", "application/json", bytes.NewReader(body))
	if err != nil {
		fmt.Printf("Login error: %v\n", err)
		return
	}
	defer resp.Body.Close()
	respBytes, _ := io.ReadAll(resp.Body)
	
	var loginRes struct {
		Token string `json:"token"`
	}
	json.Unmarshal(respBytes, &loginRes)
	fmt.Printf("Login Status: %d | Token received: %v\n", resp.StatusCode, loginRes.Token != "")

	// 2. Fetch Certificates
	req, _ := http.NewRequest("GET", baseURL+"/certificates", nil)
	req.Header.Set("Authorization", "Bearer "+loginRes.Token)
	client := &http.Client{}
	certResp, err := client.Do(req)
	if err != nil {
		fmt.Printf("Cert error: %v\n", err)
		return
	}
	defer certResp.Body.Close()
	certBytes, _ := io.ReadAll(certResp.Body)
	fmt.Printf("Certificates endpoint response (Status %d):\n%s\n", certResp.StatusCode, string(certBytes))

	// 3. Fetch Public Stats
	statsResp, err := http.Get(baseURL + "/public/stats")
	if err == nil {
		defer statsResp.Body.Close()
		statsBytes, _ := io.ReadAll(statsResp.Body)
		fmt.Printf("\nPublic stats response (Status %d):\n%s\n", statsResp.StatusCode, string(statsBytes))
	}
}
