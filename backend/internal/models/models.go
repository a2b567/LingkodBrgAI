package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Base model to handle UUIDs and standard timestamps
type Base struct {
	ID        uuid.UUID  `gorm:"type:uuid;primary_key" json:"id"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	DeletedAt *time.Time `gorm:"index" json:"deleted_at,omitempty"`
}

// BeforeCreate hooks to automatically generate UUIDs if they aren't set
func (base *Base) BeforeCreate(tx *gorm.DB) error {
	if base.ID == uuid.Nil {
		base.ID = uuid.New()
	}
	return nil
}

// User model for Auth and RBAC
type User struct {
	Base
	Username          string `gorm:"uniqueIndex;not null" json:"username"`
	Email             string `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash      string `gorm:"not null" json:"-"`
	Role              string `gorm:"not null;default:'Resident'" json:"role"` // Super Admin, Barangay Captain, Secretary, Treasurer, Health Worker, Staff, Resident
	IsVerified        bool   `gorm:"default:false" json:"is_verified"`
	VerificationToken string `json:"-"`
	OTP               string `json:"-"`
	OTPExpiry         *time.Time `json:"-"`
	ResidentID        *uuid.UUID `gorm:"type:uuid" json:"resident_id,omitempty"`
	Resident          *Resident  `gorm:"foreignKey:ResidentID" json:"resident,omitempty"`
}

// Resident model representing individual citizens
type Resident struct {
	Base
	FirstName       string     `gorm:"not null" json:"first_name"`
	MiddleName      string     `json:"middle_name"`
	LastName        string     `gorm:"not null" json:"last_name"`
	Suffix          string     `json:"suffix"`
	Birthdate       time.Time  `gorm:"not null" json:"birthdate"`
	Age             int        `gorm:"-" json:"age"` // Ignored by GORM, computed on retrieval
	Gender          string     `gorm:"not null" json:"gender"`
	CivilStatus     string     `gorm:"not null" json:"civil_status"`
	Occupation      string     `json:"occupation"`
	ContactNumber   string     `json:"contact_number"`
	Email           string     `json:"email"`
	Address         string     `gorm:"not null" json:"address"`
	Citizenship     string     `gorm:"default:'Filipino'" json:"citizenship"`
	ResidencyStatus string     `gorm:"default:'Permanent'" json:"residency_status"` // Permanent, Temporary
	VoterStatus     string     `gorm:"default:'Not Registered'" json:"voter_status"` // Registered, Not Registered
	IsPregnant      bool       `gorm:"default:false" json:"is_pregnant"`
	IsSenior        bool       `gorm:"default:false" json:"is_senior"`
	IsPWD           bool       `gorm:"default:false" json:"is_pwd"`
	ProfilePhoto    string     `json:"profile_photo"`
	HouseholdID     *uuid.UUID `gorm:"type:uuid" json:"household_id,omitempty"`
	IsHouseholdHead bool       `gorm:"default:false" json:"is_household_head"`
	QRID            string     `gorm:"uniqueIndex" json:"qr_id"`
}

// Compute Age on retrieve helper
func (r *Resident) AfterFind(tx *gorm.DB) error {
	r.Age = int(time.Since(r.Birthdate).Hours() / 24 / 365.25)
	return nil
}

// Household grouping
type Household struct {
	Base
	HouseholdNumber string     `gorm:"uniqueIndex;not null" json:"household_number"`
	HeadID          *uuid.UUID `gorm:"type:uuid" json:"head_id,omitempty"`
	Head            *Resident  `gorm:"foreignKey:HeadID" json:"head,omitempty"`
	PovertyLevel    string     `gorm:"default:'Non-Poor'" json:"poverty_level"` // Non-Poor, Low Income, Poor, Indigent
	Address         string     `gorm:"not null" json:"address"`
	Members         []Resident `gorm:"foreignKey:HouseholdID" json:"members,omitempty"`
}

// Certificate & Document requesting/processing
type Certificate struct {
	Base
	ResidentID     uuid.UUID  `gorm:"type:uuid;not null" json:"resident_id"`
	Resident       Resident   `gorm:"foreignKey:ResidentID" json:"resident"`
	Type           string     `gorm:"not null" json:"type"` // Clearance, Indigency, Residency, Business Clearance, Cedula
	DocumentNumber string     `gorm:"uniqueIndex;not null" json:"document_number"`
	Status         string     `gorm:"default:'Pending'" json:"status"` // Pending, Approved, Rejected, Ready for Pickup, Issued
	Purpose        string     `json:"purpose"`
	ESignaturePath string     `json:"e_signature_path"`
	PDFPath        string     `json:"pdf_path"`
	QRHash         string     `gorm:"uniqueIndex;not null" json:"qr_hash"`
	Fee            float64    `gorm:"type:decimal(10,2);default:0.00" json:"fee"`
	PaymentStatus  string     `gorm:"default:'Unpaid'" json:"payment_status"` // Unpaid, Paid
	RequestDate    time.Time  `json:"request_date"`
	IssueDate      *time.Time `json:"issue_date,omitempty"`
}

// QueueTicket represents a kiosk queue entry with priority handling
type QueueTicket struct {
    Base
    QueueNumber string    `gorm:"not null" json:"queue_number"` // e.g., "P-001" or "R-001"
    ResidentID  uuid.UUID `gorm:"type:uuid;not null" json:"resident_id"`
    Resident    Resident  `gorm:"foreignKey:ResidentID" json:"resident"`
    IsPWD      bool      `gorm:"default:false" json:"is_pwd"`
    IsSenior   bool      `gorm:"default:false" json:"is_senior"`
    IsPregnant bool      `gorm:"default:false" json:"is_pregnant"`
    IsPriority bool      `gorm:"default:false" json:"is_priority"` // computed flag
    Status     string    `gorm:"default:'Waiting'" json:"status"`
    CreatedAt   time.Time `json:"created_at"`
    ServedAt   *time.Time `json:"served_at,omitempty"`
    CompletedAt *time.Time `json:"completed_at,omitempty"`
}


// Blotter and Incident Records
type Blotter struct {
	Base
	CaseNumber        string     `gorm:"uniqueIndex;not null" json:"case_number"`
	Complainant       string     `gorm:"not null" json:"complainant"`
	Respondent        string     `gorm:"not null" json:"respondent"`
	Details           string     `gorm:"type:text;not null" json:"details"`
	Status            string     `gorm:"default:'Pending'" json:"status"` // Pending, Active, Settled, Dismissed
	IncidentDate      time.Time  `gorm:"not null" json:"incident_date"`
	FilingDate        time.Time  `json:"filing_date"`
	HearingSchedules  string     `gorm:"type:text" json:"hearing_schedules"` // JSON String representation of schedule list
	SettlementDetails string     `gorm:"type:text" json:"settlement_details"`
	EvidencePaths     string     `json:"evidence_paths"` // Comma-separated paths
	AISummary         string     `gorm:"type:text" json:"ai_summary"`
}

// Business Permit Registry
type Business struct {
	Base
	BusinessName     string    `gorm:"not null" json:"business_name"`
	OwnerID          uuid.UUID `gorm:"type:uuid;not null" json:"owner_id"`
	Owner            Resident  `gorm:"foreignKey:OwnerID" json:"owner"`
	PermitNumber     string    `gorm:"uniqueIndex" json:"permit_number"`
	Status           string    `gorm:"default:'Pending'" json:"status"` // Active, Pending, Expired, Suspended
	Address          string    `gorm:"not null" json:"address"`
	Category         string    `json:"category"`
	RegistrationDate time.Time `json:"registration_date"`
	ExpiryDate       time.Time `json:"expiry_date"`
	InspectionStatus string    `gorm:"default:'Pending'" json:"inspection_status"` // Passed, Failed, Pending
}

// Appointment Scheduling
type Appointment struct {
	Base
	ResidentID      uuid.UUID `gorm:"type:uuid;not null" json:"resident_id"`
	Resident        Resident  `gorm:"foreignKey:ResidentID" json:"resident"`
	Purpose         string    `gorm:"not null" json:"purpose"`
	AppointmentDate time.Time `gorm:"not null" json:"appointment_date"`
	TimeSlot        string    `gorm:"not null" json:"time_slot"` // e.g. "09:00 AM - 10:00 AM"
	Status          string    `gorm:"default:'Pending'" json:"status"` // Pending, Confirmed, Cancelled, Completed
	QueueNumber     int       `json:"queue_number"`
}

// Notification System
type Notification struct {
	ID        uuid.UUID  `gorm:"type:uuid;primary_key" json:"id"`
	UserID    *uuid.UUID `gorm:"type:uuid" json:"user_id,omitempty"` // Null means broadcast to all users
	Title     string     `gorm:"not null" json:"title"`
	Content   string     `gorm:"type:text;not null" json:"content"`
	Type      string     `gorm:"default:'Alert'" json:"type"` // Alert, Announcement, Appointment, Blotter, Document
	IsRead    bool       `gorm:"default:false" json:"is_read"`
	CreatedAt time.Time  `json:"created_at"`
}

func (n *Notification) BeforeCreate(tx *gorm.DB) error {
	if n.ID == uuid.Nil {
		n.ID = uuid.New()
	}
	return nil
}

// Payment Transaction Records
type Payment struct {
	Base
	ReferenceNumber string       `gorm:"uniqueIndex;not null" json:"reference_number"`
	Purpose         string       `gorm:"not null" json:"purpose"`
	Amount          float64      `gorm:"type:decimal(10,2);not null" json:"amount"`
	Status          string       `gorm:"default:'Pending'" json:"status"` // Pending, Paid, Refunded
	PayorName       string       `gorm:"not null" json:"payor_name"`
	CertificateID   *uuid.UUID   `gorm:"type:uuid" json:"certificate_id,omitempty"`
	BusinessID      *uuid.UUID   `gorm:"type:uuid" json:"business_id,omitempty"`
	TransactionDate time.Time    `json:"transaction_date"`
}

// Audit Logs
type AuditLog struct {
	ID        uuid.UUID  `gorm:"type:uuid;primary_key" json:"id"`
	UserID    *uuid.UUID `gorm:"type:uuid" json:"user_id,omitempty"`
	Action    string     `gorm:"not null" json:"action"`
	Details   string     `gorm:"type:text" json:"details"`
	IPAddress string     `json:"ip_address"`
	CreatedAt time.Time  `json:"created_at"`
}

func (a *AuditLog) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}

// AI Interaction Logs
type AILog struct {
	ID         uuid.UUID  `gorm:"type:uuid;primary_key" json:"id"`
	UserID     *uuid.UUID `gorm:"type:uuid" json:"user_id,omitempty"`
	Prompt     string     `gorm:"type:text;not null" json:"prompt"`
	Response   string     `gorm:"type:text;not null" json:"response"`
	TokensUsed int        `json:"tokens_used"`
	CreatedAt  time.Time  `json:"created_at"`
}

func (a *AILog) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}
