package backend_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"backend/internal/config"
	"backend/internal/models"
	"backend/internal/routes"
	"backend/internal/services"
	"github.com/google/uuid"
)

type TestRunner struct {
	t      *testing.T
	client *http.Client
	server *httptest.Server
	token  string
}

func (tr *TestRunner) req(method, path string, body interface{}, target interface{}) (int, error) {
	var bodyReader io.Reader
	if body != nil {
		data, _ := json.Marshal(body)
		bodyReader = bytes.NewReader(data)
	}

	req, err := http.NewRequest(method, tr.server.URL+path, bodyReader)
	if err != nil {
		return 0, err
	}
	req.Header.Set("Content-Type", "application/json")
	if tr.token != "" {
		req.Header.Set("Authorization", "Bearer "+tr.token)
	}

	resp, err := tr.client.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return resp.StatusCode, err
	}

	if target != nil && len(respBytes) > 0 {
		_ = json.Unmarshal(respBytes, target)
	}

	return resp.StatusCode, nil
}

func TestAllCRUDOperations(t *testing.T) {
	os.Setenv("PORT", "8080")
	os.Setenv("DB_HOST", "sqlite")
	os.Setenv("DATABASE_URL", "")
	os.Setenv("POSTGRES_URL", "")
	os.Setenv("POSTGRES_HOST", "")
	cfg := config.LoadConfig()
	db, err := config.InitDB(cfg)
	if err != nil {
		t.Fatalf("Failed to init DB: %v", err)
	}
	_ = config.SeedDatabase(db)
	services.InitHub()

	engine := routes.SetupRouter()
	ts := httptest.NewServer(engine)
	defer ts.Close()

	tr := &TestRunner{
		t:      t,
		client: ts.Client(),
		server: ts,
	}

	// 1. PUBLIC ENDPOINTS
	var pingResp map[string]string
	status, _ := tr.req("GET", "/api/ping", nil, &pingResp)
	if status != 200 || pingResp["message"] != "pong" {
		t.Errorf("GET /api/ping failed with status %d", status)
	}

	var statsResp map[string]interface{}
	status, _ = tr.req("GET", "/api/public/stats", nil, &statsResp)
	if status != 200 {
		t.Errorf("GET /api/public/stats failed with status %d", status)
	}

	// 2. AUTHENTICATION
	var loginResp struct {
		Token string      `json:"token"`
		User  models.User `json:"user"`
	}
	status, _ = tr.req("POST", "/api/auth/login", map[string]string{
		"username": "admin",
		"password": "password123",
	}, &loginResp)
	if status != 200 || loginResp.Token == "" {
		t.Fatalf("POST /api/auth/login failed with status %d", status)
	}
	tr.token = loginResp.Token

	var meResp models.User
	status, _ = tr.req("GET", "/api/auth/me", nil, &meResp)
	if status != 200 || meResp.Username != "admin" {
		t.Errorf("GET /api/auth/me failed with status %d", status)
	}

	// 3. RESIDENTS CRUD
	var createdRes models.Resident
	resPayload := map[string]interface{}{
		"first_name":       "Maria",
		"last_name":        "Clara",
		"birthdate":        "1992-03-15T00:00:00Z",
		"gender":           "Female",
		"civil_status":     "Single",
		"address":          "Zone 4, Rizal Street",
		"citizenship":      "Filipino",
		"residency_status": "Permanent",
		"voter_status":     "Registered",
	}
	status, _ = tr.req("POST", "/api/residents", resPayload, &createdRes)
	if status != 201 || createdRes.ID == uuid.Nil {
		t.Fatalf("POST /api/residents CREATE failed with status %d", status)
	}

	var getRes models.Resident
	status, _ = tr.req("GET", fmt.Sprintf("/api/residents/%s", createdRes.ID), nil, &getRes)
	if status != 200 || getRes.FirstName != "Maria" {
		t.Errorf("GET /api/residents/:id READ failed with status %d", status)
	}

	var updateRes models.Resident
	status, _ = tr.req("PUT", fmt.Sprintf("/api/residents/%s", createdRes.ID), map[string]interface{}{
		"first_name": "Maria Elena",
	}, &updateRes)
	if status != 200 || updateRes.FirstName != "Maria Elena" {
		t.Errorf("PUT /api/residents/:id UPDATE failed with status %d", status)
	}

	var resList struct {
		Data  []models.Resident `json:"data"`
		Total int64             `json:"total"`
	}
	status, _ = tr.req("GET", "/api/residents?limit=10", nil, &resList)
	if status != 200 || len(resList.Data) == 0 {
		t.Errorf("GET /api/residents LIST failed with status %d", status)
	}

	// 4. HOUSEHOLDS CRUD
	var createdHh models.Household
	hhPayload := map[string]interface{}{
		"household_number": fmt.Sprintf("HH-TEST-%d", uuid.New().ID()),
		"poverty_level":    "Low Income",
		"address":          "Zone 2, Test Street",
	}
	status, _ = tr.req("POST", "/api/households", hhPayload, &createdHh)
	if status != 201 || createdHh.ID == uuid.Nil {
		t.Fatalf("POST /api/households CREATE failed with status %d", status)
	}

	var getHh models.Household
	status, _ = tr.req("GET", fmt.Sprintf("/api/households/%s", createdHh.ID), nil, &getHh)
	if status != 200 {
		t.Errorf("GET /api/households/:id READ failed with status %d", status)
	}

	var updatedHh models.Household
	status, _ = tr.req("PUT", fmt.Sprintf("/api/households/%s", createdHh.ID), map[string]interface{}{
		"poverty_level": "Indigent",
	}, &updatedHh)
	if status != 200 {
		t.Errorf("PUT /api/households/:id UPDATE failed with status %d", status)
	}

	var hhList []models.Household
	status, _ = tr.req("GET", "/api/households", nil, &hhList)
	if status != 200 || len(hhList) == 0 {
		t.Errorf("GET /api/households LIST failed with status %d", status)
	}

	// 5. CERTIFICATES CRUD
	var createdCert models.Certificate
	certPayload := map[string]interface{}{
		"resident_id": createdRes.ID.String(),
		"type":        "Clearance",
		"purpose":     "Employment Requirements",
		"fee":         50.00,
	}
	status, _ = tr.req("POST", "/api/certificates", certPayload, &createdCert)
	if status != 201 || createdCert.ID == uuid.Nil {
		t.Fatalf("POST /api/certificates CREATE failed with status %d", status)
	}

	var getCert models.Certificate
	status, _ = tr.req("GET", fmt.Sprintf("/api/certificates/%s", createdCert.ID), nil, &getCert)
	if status != 200 || getCert.Type != "Clearance" {
		t.Errorf("GET /api/certificates/:id READ failed with status %d", status)
	}

	var approvedCert models.Certificate
	status, _ = tr.req("POST", fmt.Sprintf("/api/certificates/%s/approve", createdCert.ID), nil, &approvedCert)
	if status != 200 || approvedCert.Status != "Issued" {
		t.Errorf("POST /api/certificates/:id/approve ACTION failed with status %d (status=%s)", status, approvedCert.Status)
	}

	var certList []models.Certificate
	status, _ = tr.req("GET", "/api/certificates", nil, &certList)
	if status != 200 || len(certList) == 0 {
		t.Errorf("GET /api/certificates LIST failed with status %d", status)
	}

	// QR Verification
	var verifyResp map[string]interface{}
	status, _ = tr.req("GET", fmt.Sprintf("/api/verify/document/%s", createdCert.QRHash), nil, &verifyResp)
	if status != 200 || verifyResp["valid"] != true {
		t.Errorf("GET /api/verify/document/:hash QR VERIFY failed with status %d", status)
	}

	// 6. BLOTTERS CRUD
	var createdBlotter models.Blotter
	blotterPayload := map[string]interface{}{
		"complainant": "Pedro Penduko",
		"respondent":  "Juan Tamad",
		"incident":    "Boundary Dispute",
		"details":     "Fence encroaching over boundary line",
		"status":      "Pending",
	}
	status, _ = tr.req("POST", "/api/blotters", blotterPayload, &createdBlotter)
	if status != 201 || createdBlotter.ID == uuid.Nil {
		t.Fatalf("POST /api/blotters CREATE failed with status %d", status)
	}

	var getBlotter models.Blotter
	status, _ = tr.req("GET", fmt.Sprintf("/api/blotters/%s", createdBlotter.ID), nil, &getBlotter)
	if status != 200 {
		t.Errorf("GET /api/blotters/:id READ failed with status %d", status)
	}

	var updatedBlotter models.Blotter
	status, _ = tr.req("PUT", fmt.Sprintf("/api/blotters/%s", createdBlotter.ID), map[string]interface{}{
		"status": "In Hearing",
	}, &updatedBlotter)
	if status != 200 || updatedBlotter.Status != "In Hearing" {
		t.Errorf("PUT /api/blotters/:id UPDATE failed with status %d", status)
	}

	var blotterList []models.Blotter
	status, _ = tr.req("GET", "/api/blotters", nil, &blotterList)
	if status != 200 || len(blotterList) == 0 {
		t.Errorf("GET /api/blotters LIST failed with status %d", status)
	}

	// 7. BUSINESS CLEARANCE CRUD
	var createdBiz models.Business
	bizPayload := map[string]interface{}{
		"business_name": "Lawrence Hardware & Supplies",
		"owner_name":    "Crisostomo Ibarra",
		"business_type": "Retail & Hardware",
		"address":       "Zone 3, Main Highway",
		"status":        "Active",
	}
	status, _ = tr.req("POST", "/api/businesses", bizPayload, &createdBiz)
	if status != 201 || createdBiz.ID == uuid.Nil {
		t.Fatalf("POST /api/businesses CREATE failed with status %d", status)
	}

	var getBiz models.Business
	status, _ = tr.req("GET", fmt.Sprintf("/api/businesses/%s", createdBiz.ID), nil, &getBiz)
	if status != 200 {
		t.Errorf("GET /api/businesses/:id READ failed with status %d", status)
	}

	var updatedBiz models.Business
	status, _ = tr.req("PUT", fmt.Sprintf("/api/businesses/%s", createdBiz.ID), map[string]interface{}{
		"status": "Renewed",
	}, &updatedBiz)
	if status != 200 || updatedBiz.Status != "Renewed" {
		t.Errorf("PUT /api/businesses/:id UPDATE failed with status %d", status)
	}

	var bizList []models.Business
	status, _ = tr.req("GET", "/api/businesses", nil, &bizList)
	if status != 200 || len(bizList) == 0 {
		t.Errorf("GET /api/businesses LIST failed with status %d", status)
	}

	// 8. APPOINTMENTS CRUD
	var createdApp models.Appointment
	appPayload := map[string]interface{}{
		"resident_id":      createdRes.ID.String(),
		"purpose":          "Barangay ID Pickup",
		"appointment_date": "2026-10-20",
		"time_slot":        "09:00 AM - 10:00 AM",
	}
	status, _ = tr.req("POST", "/api/appointments", appPayload, &createdApp)
	if status != 201 || createdApp.ID == uuid.Nil {
		t.Fatalf("POST /api/appointments CREATE failed with status %d", status)
	}

	var appList []models.Appointment
	status, _ = tr.req("GET", "/api/appointments", nil, &appList)
	if status != 200 || len(appList) == 0 {
		t.Errorf("GET /api/appointments LIST failed with status %d", status)
	}

	var updatedApp models.Appointment
	status, _ = tr.req("PUT", fmt.Sprintf("/api/appointments/%s/status", createdApp.ID), map[string]interface{}{
		"status": "Completed",
	}, &updatedApp)
	if status != 200 || updatedApp.Status != "Completed" {
		t.Errorf("PUT /api/appointments/:id/status UPDATE failed with status %d", status)
	}

	var congestionResp []interface{}
	status, _ = tr.req("GET", "/api/appointments/congestion", nil, &congestionResp)
	if status != 200 {
		t.Errorf("GET /api/appointments/congestion PREDICT failed with status %d", status)
	}

	// 9. HEALTH RECORDS & MEDICINE STOCK CRUD
	var createdStock models.MedicineStock
	stockPayload := map[string]interface{}{
		"name":     "Amoxicillin 500mg",
		"category": "Antibiotics",
		"quantity": 100,
		"unit":     "capsules",
		"minStock": 15,
	}
	status, _ = tr.req("POST", "/api/medicine-stock", stockPayload, &createdStock)
	if status != 201 || createdStock.ID == uuid.Nil {
		t.Fatalf("POST /api/medicine-stock CREATE failed with status %d", status)
	}

	var stockList []models.MedicineStock
	status, _ = tr.req("GET", "/api/medicine-stock", nil, &stockList)
	if status != 200 || len(stockList) == 0 {
		t.Errorf("GET /api/medicine-stock LIST failed with status %d", status)
	}

	var restocked models.MedicineStock
	status, _ = tr.req("PUT", fmt.Sprintf("/api/medicine-stock/%s/restock", createdStock.ID), map[string]interface{}{
		"quantity": 50,
	}, &restocked)
	if status != 200 || restocked.Stock != 150 {
		t.Errorf("PUT /api/medicine-stock/:id/restock UPDATE failed with status %d, got stock=%d", status, restocked.Stock)
	}

	var createdHealthRec models.HealthRecord
	healthPayload := map[string]interface{}{
		"resident_name": "Maria Clara",
		"age":           30,
		"blood_type":    "O+",
		"allergies":     "None",
		"conditions":    "Pharyngitis",
		"last_checkup":  "2026-09-12",
		"status":        "Under Observation",
	}
	status, _ = tr.req("POST", "/api/health-records", healthPayload, &createdHealthRec)
	if status != 201 || createdHealthRec.ID == uuid.Nil {
		t.Fatalf("POST /api/health-records CREATE failed with status %d", status)
	}

	var healthList []models.HealthRecord
	status, _ = tr.req("GET", "/api/health-records", nil, &healthList)
	if status != 200 || len(healthList) == 0 {
		t.Errorf("GET /api/health-records LIST failed with status %d", status)
	}

	var dispenseResp map[string]interface{}
	status, _ = tr.req("POST", fmt.Sprintf("/api/health-records/%s/dispense", createdHealthRec.ID), map[string]interface{}{
		"medicineName": "Amoxicillin 500mg",
		"quantity":     10,
	}, &dispenseResp)
	if status != 200 {
		t.Errorf("POST /api/health-records/:id/dispense ACTION failed with status %d", status)
	}

	// 10. ANNOUNCEMENTS & NOTIFICATIONS
	var createdNotif models.Notification
	notifPayload := map[string]interface{}{
		"title":   "General Barangay Meeting",
		"content": "All zone leaders meeting at Hall",
		"type":    "Announcement",
	}
	status, _ = tr.req("POST", "/api/announcements", notifPayload, &createdNotif)
	if status != 201 || createdNotif.ID == uuid.Nil {
		t.Fatalf("POST /api/announcements CREATE failed with status %d", status)
	}

	var notifList []models.Notification
	status, _ = tr.req("GET", "/api/notifications", nil, &notifList)
	if status != 200 || len(notifList) == 0 {
		t.Errorf("GET /api/notifications LIST failed with status %d", status)
	}

	// 11. ANALYTICS DASHBOARD
	var dashResp map[string]interface{}
	status, _ = tr.req("GET", "/api/analytics/dashboard", nil, &dashResp)
	if status != 200 {
		t.Errorf("GET /api/analytics/dashboard READ failed with status %d", status)
	}

	// 12. CLEANUP / DELETE OPERATIONS
	status, _ = tr.req("DELETE", fmt.Sprintf("/api/residents/%s", createdRes.ID), nil, nil)
	if status != 200 {
		t.Errorf("DELETE /api/residents/:id failed with status %d", status)
	}

	status, _ = tr.req("DELETE", fmt.Sprintf("/api/households/%s", createdHh.ID), nil, nil)
	if status != 200 {
		t.Errorf("DELETE /api/households/:id failed with status %d", status)
	}

	status, _ = tr.req("DELETE", fmt.Sprintf("/api/certificates/%s", createdCert.ID), nil, nil)
	if status != 200 {
		t.Errorf("DELETE /api/certificates/:id failed with status %d", status)
	}

	status, _ = tr.req("DELETE", fmt.Sprintf("/api/blotters/%s", createdBlotter.ID), nil, nil)
	if status != 200 {
		t.Errorf("DELETE /api/blotters/:id failed with status %d", status)
	}

	status, _ = tr.req("DELETE", fmt.Sprintf("/api/businesses/%s", createdBiz.ID), nil, nil)
	if status != 200 {
		t.Errorf("DELETE /api/businesses/:id failed with status %d", status)
	}

	status, _ = tr.req("DELETE", fmt.Sprintf("/api/health-records/%s", createdHealthRec.ID), nil, nil)
	if status != 200 {
		t.Errorf("DELETE /api/health-records/:id failed with status %d", status)
	}

	status, _ = tr.req("DELETE", fmt.Sprintf("/api/medicine-stock/%s", createdStock.ID), nil, nil)
	if status != 200 {
		t.Errorf("DELETE /api/medicine-stock/:id failed with status %d", status)
	}

	fmt.Println("All CRUD operations executed and verified successfully!")
}
