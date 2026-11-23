# 🏛️ LingkodBrgyAI
**Enterprise Barangay Management Information System (BMIS) & Citizen e-Governance Platform**  
*Official Digital Governance System for Barangay Santa Cruz, Bay, Laguna, Philippines*

[![Frontend](https://img.shields.io/badge/Frontend-React_19_%2B_TypeScript_5.8-2563eb?style=for-the-badge&logo=react)](https://lingkodbrgyai.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Go_1.24_(Gin_%2B_GORM)-00ADD8?style=for-the-badge&logo=go)](https://lingkodbrgai.onrender.com/api/ping)
[![Database](https://img.shields.io/badge/Database-Supabase_PostgreSQL_%2B_SQLite-3ECF8E?style=for-the-badge&logo=postgresql)](https://supabase.com)
[![AI Engine](https://img.shields.io/badge/AI_Engine-Groq_LLM_%2B_RAG-f59e0b?style=for-the-badge&logo=openai)](https://lingkodbrgyai.vercel.app)
[![Compliance](https://img.shields.io/badge/Compliance-RA_10173_(Data_Privacy_Act)-10b981?style=for-the-badge)](https://privacy.gov.ph)

---

## 📌 Table of Contents
1. [Executive Summary](#-1-executive-summary)
2. [Official Production Endpoints](#-2-official-production-endpoints)
3. [System Architecture](#-3-system-architecture)
4. [Technology Stack](#-4-technology-stack)
5. [Artificial Intelligence (AI) Engine](#-5-artificial-intelligence-ai-engine)
6. [Core System Modules & Capabilities](#-6-core-system-modules--capabilities)
7. [Role-Based Access Control (RBAC) Matrix](#-7-role-based-access-control-rbac-matrix)
8. [Database Schema & 3NF Normalization](#-8-database-schema--3nf-normalization)
9. [Complete REST API & WebSocket Reference](#-9-complete-rest-api--websocket-reference)
10. [Local Setup & Deployment Guide](#-10-local-setup--deployment-guide)

---

## 📋 1. Executive Summary

**LingkodBrgyAI** is a cloud-native, offline-resilient Barangay Management Information System (BMIS) and citizen digital portal engineered for Philippine Local Government Units (LGUs).

The platform digitizes end-to-end barangay operations—including citizen registration, Registry of Barangay Inhabitants (RBI) household profiling, cryptographic QR-verified certificate and clearance issuance, Katarungang Pambarangay blotter and peace mediation, rural health center clinics and pharmacy inventory, business permit clearances, and self-service lobby touch kiosks—while strictly enforcing the **Data Privacy Act of 2012 (Republic Act No. 10173)**.

---

## 🌐 2. Official Production Endpoints

| Environment | Production URL | Target Audience |
| :--- | :--- | :--- |
| **Primary Citizen Portal** | [https://lingkodbrgy.vercel.app](https://lingkodbrgy.vercel.app) | Public citizens, certificate requests, and online appointment booking |
| **Administrative Portal** | [https://lingkodbrgyasystem.vercel.app](https://lingkodbrgyasystem.vercel.app) | Barangay Captain, Secretary, Treasurer, Health Worker, and Staff |
| **AI & Developer Portal** | [https://lingkodbrgyai.vercel.app](https://lingkodbrgyai.vercel.app) | AI Governance Assistant, Developer Console, and System Telemetry |
| **Backend API Gateway** | `https://lingkodbrgai.onrender.com/api` | Go Gin RESTful API & WebSocket Server |

---

## 🏗️ 3. System Architecture

```mermaid
graph TD
    subgraph Public["Public & Citizen Interfaces"]
        LP[Landing & QR Verification Portal]
        CP[Citizen / Resident Mobile & Web Portal]
        Kiosk[Public Lobby Touchscreen Kiosk]
    end

    subgraph Gateway["Security & Application Gateway"]
        VercelEdge[Vercel Global CDN & Edge Proxy]
        AuthGate[Strict JWT & RBAC Authorization]
        RateLimiter[Kiosk & Auth Rate Limiting]
    end

    subgraph Backend["Go Enterprise Backend (Golang 1.24)"]
        GinEngine[Gin HTTP REST & WebSocket Engine]
        ErrorCapture[Real-time Error & Threat Telemetry]
        AuditLog[Immutable Audit & Activity Logger]
        Services[SMTP Email & Firebase Cloud Services]
    end

    subgraph Data["Database & Storage Layer"]
        Supabase[(Supabase Cloud PostgreSQL)]
        LocalDB[(SQLite Offline Fallback Mirror)]
        Firebase[(Firebase Cloud Storage)]
    end

    Public --> VercelEdge
    VercelEdge --> AuthGate
    AuthGate --> RateLimiter
    RateLimiter --> GinEngine
    GinEngine --> ErrorCapture
    GinEngine --> AuditLog
    GinEngine --> Services
    GinEngine --> Supabase
    GinEngine -.-> LocalDB
    Services --> Firebase
```

---

## 🛠️ 4. Technology Stack

| Layer | Technology | Version / Provider | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React + TypeScript | React 19 + TypeScript 5.8 | Reactive component architecture & type safety |
| **State Management** | Zustand | Zustand 5.x | Lightweight persistent auth, theme, & privacy stores |
| **Build & Bundler** | Vite + Rolldown | Vite 8.0.14 | Sub-second HMR and code-split production bundles |
| **Styling & Icons** | Tailwind CSS + Lucide | Tailwind 3.4 + Lucide React | Responsive government UI & dark/light mode |
| **Data Visualization** | Recharts | Recharts 2.15 | Demographic, revenue, and clinic analytics charts |
| **Backend Runtime** | Go (Golang) | Go 1.24.x | High-concurrency, low-latency REST & WebSocket server |
| **Web Framework** | Gin Web Framework | Gin-Gonic 1.9 | HTTP routing, CORS, rate-limiting, & JWT middleware |
| **ORM & Migrations** | GORM | GORM 1.31 | Auto-migrations & relational query builder |
| **Primary Database** | PostgreSQL | Supabase Cloud (Pooler) | Distributed cloud relational database |
| **Offline Database** | SQLite | Glebarez SQLite (Pure Go) | Automatic zero-downtime local fallback storage |
| **AI Inference** | Groq Cloud LLM API | `openai/gpt-oss-120b` / `qwen3.6` | Context-aware RAG chat & legal blotter summarization |
| **Security & Auth** | JWT + Bcrypt + reCAPTCHA | Google reCAPTCHA v2 + OTP | Multi-factor citizen verification & session renewal |

---

## 🤖 5. Artificial Intelligence (AI) Engine

LingkodBrgyAI features a **Dual-Layer Hybrid AI Architecture** combining cloud LLM inference (**Groq API**) with a **Backend Retrieval-Augmented Generation (RAG) Context Engine** and an offline rule-based fallback.

```mermaid
graph TD
    UserQuery[User Query / Action] --> FrontendClient[React Frontend / AI Floating Panel]
    FrontendClient --> BackendRoute["POST /api/ai/chat"]
    
    subgraph RAG["Retrieval-Augmented Generation (RAG)"]
        BackendRoute --> RoleCheck{RBAC Role Check}
        RoleCheck -->|Staff / Admin| FullContext[Extract Live DB Context: Demographics, Blotters, Indigents, Revenue]
        RoleCheck -->|Resident| PersonalContext[Extract Personal Context: Own Certificates, Appointments, Requirements]
        FullContext --> ContextMerge[Inject Real-Time Context into System Prompt]
        PersonalContext --> ContextMerge
    end

    subgraph LLM["Multi-Model Inference Cascade (Groq Cloud)"]
        ContextMerge --> PrimaryModel["Primary: openai/gpt-oss-120b"]
        PrimaryModel -.->|On Rate Limit / Timeout| Fallback1["Fallback 1: openai/gpt-oss-20b"]
        Fallback1 -.->|On Failure| Fallback2["Fallback 2: qwen/qwen3.6-27b"]
        Fallback2 -.->|Offline Mode| LocalRulesEngine["Local Deterministic AI Engine"]
    end

    LLM --> Sanitize[Entity & LGU Naming Sanitizer]
    Sanitize --> AuditLog[(Log Prompt & Tokens to AILog Table)]
    AuditLog --> StreamResponse[Return Formatted Markdown Response]
```

### AI Capabilities Summary
| AI Feature | Model / Engine | Description |
| :--- | :--- | :--- |
| **Executive Governance Advisor** | `openai/gpt-oss-120b` | Synthesizes live demographic counts, pending clearances, active blotter disputes, and collection revenues into executive insights for the Barangay Captain. |
| **Multilingual Citizen Assistant** | `openai/gpt-oss-20b` | Answers resident questions on document fees, requirements, and clinic hours in **English, Tagalog, or Taglish** with voice synthesis (TTS) and speech-to-text (STT). |
| **Blotter Legal Case Summarizer** | `qwen/qwen3.6-27b` | Generates concise 2–3 sentence legal mediation digests (`ai_summary`) with recommended actions under Katarungang Pambarangay rules. |
| **Smart Load Balancing & Congestion** | Statistical Heuristic | Forecasts 7-day appointment queue congestion (`Low`, `Medium`, `High`) to guide citizens toward lower-volume days. |

---

## 📦 6. Core System Modules & Capabilities

### 6.1. Authentication, Security & Privacy (RA 10173)
* **Bi-Modal Authentication:**
  * **Barangay Staff:** Direct login for rapid counter operations.
  * **Citizens / Residents:** Protected by Google reCAPTCHA v2, strict one-account-per-citizen validation, and 6-digit email OTP verification.
* **Global Privacy Masking (`usePrivacyStore`):** 1-click PII masking blurs sensitive names, addresses, and contact numbers across tables during public screen viewing, with granular per-row reveal toggles.
* **Strict Blotter Confidentiality:** Peace mediation hearings and blotter records are strictly isolated at both the API and UI layers so residents can never view other citizens' dispute records.

### 6.2. Resident Registry & Digital QR Citizen ID
* Tracks voter status, residency type (`Permanent` / `Temporary`), senior citizens, PWDs, and pregnant women.
* Generates an official **Digital Barangay Citizen ID Card** with a cryptographic QR code verifiable at `/verify/document/:hash`.
* Built-in duplicate detection (`⚠️ Duplicate`) and CSV bulk import/export.

### 6.3. Household RBI (Registry of Barangay Inhabitants)
* Maps households by `HouseholdNumber`, `Purok`, and socio-economic classification (`Non-Poor`, `Low Income`, `Poor`, `Indigent`).
* Links family heads (`HeadID`) and household members (`Members []Resident`).

### 6.4. Certificates, Clearances & Self-Service Lobby Kiosk
* Supports **Barangay Clearance, Certificate of Indigency, Certificate of Residency, Business Clearance, Community Tax Certificate (Cedula), and Barangay ID**.
* **Touchscreen Lobby Kiosk (`/kiosk/certificates` & `/kiosk/queue`):** Dedicated walk-in interface with priority queueing (`P-001` for Senior/PWD/Pregnant, `R-001` for Regular), live TV queue monitor, and PIN-protected Admin Lock.

### 6.5. Katarungang Pambarangay Blotter & Peace Mediation
* Tracks incident narratives, complainants, respondents, evidence attachments, and multi-session mediation schedules (`Session 1`, `Session 2`, etc.).
* Automatically synchronizes scheduled peace hearings into the staff master schedule ledger while keeping them strictly hidden from public/resident views.

### 6.6. Rural Health Center & Pharmacy Inventory
* Maintains patient medical profiles (`BloodType`, `Allergies`, `Conditions`, `Status`) and real-time clinic waiting queues.
* Tracks medicine stock batches (`MedicineStock`), low-stock thresholds (`MinStock`), and patient-level medication dispensing (`DispensedItem`).

### 6.7. Developer Console & Self-Healing Error Telemetry (`/dev-console`)
* Real-time monitoring of backend HTTP 4xx/5xx responses and uncaught frontend React exceptions (`GlobalErrorBoundary`).
* Includes automatic chunk-mismatch recovery, Service Worker cache purging, audit trail inspection, and system health scoring.

---

## 🔐 7. Role-Based Access Control (RBAC) Matrix

| System Module | Super Admin | Barangay Captain | Secretary | Treasurer | Health Worker | Staff | Resident | Developer |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Dashboard & Analytics** | Full | Full | Full | Full | Health View | View | Citizen View | Dev Console |
| **Resident Registry** | Full | Full | Full | View | View | Read / Write | Own Profile | — |
| **Household RBI** | Full | Full | Full | View | View | Read / Write | View Own | — |
| **Certificates & Clearances** | Full | Approve / Sign | Process | Fee / OR | — | Issue | Request Own | — |
| **Blotter & Peace Hearings** | Full | Full (Mediate) | Full | — | — | Read / Write | **Restricted** | — |
| **Business Permits** | Full | Full | Full | Assessment | — | Read / Write | — | — |
| **Health & Pharmacy** | Full | Full | View | — | Full Control | View | Clinic Queue | — |
| **Appointments** | Full | Full | Full | Full | Clinic Slots | Full | Own Bookings | — |
| **Staff Account Manager** | Full | Full | — | — | — | — | — | Audit View |
| **Developer Console** | — | — | — | — | — | — | — | Full Control |

---

## 🗄️ 8. Database Schema & 3NF Normalization

The database is normalized to **Third Normal Form (3NF)** across 15 core GORM models, eliminating data redundancy while employing targeted denormalization for legal receipt immutability and emergency clinic speed.

```mermaid
erDiagram
    HOUSEHOLDS ||--o{ RESIDENTS : "contains (1:N)"
    USERS ||--o| RESIDENTS : "authenticates (1:1)"
    RESIDENTS ||--o{ CERTIFICATES : "requests (1:N)"
    RESIDENTS ||--o{ APPOINTMENTS : "books (1:N)"
    RESIDENTS ||--o{ BUSINESSES : "owns (1:N)"
    RESIDENTS ||--o{ QUEUE_TICKETS : "queues (1:N)"
    RESIDENTS ||--o{ HEALTH_RECORDS : "medical profile (1:1)"
    HEALTH_RECORDS ||--o{ DISPENSED_ITEMS : "dispenses (1:N)"
    CERTIFICATES ||--o| PAYMENTS : "generates fee (1:1)"
    BUSINESSES ||--o| PAYMENTS : "generates fee (1:1)"
```

### Normalization Compliance
1. **First Normal Form (1NF):**
   * Every table enforces a unique UUID Primary Key (`ID uuid.UUID`).
   * All columns store atomic values (`first_name`, `middle_name`, `last_name`, `birthdate`, `fee`).
   * Repeating groups are eliminated via one-to-many foreign key relations (`residents.household_id`, `dispensed_items.health_record_id`).
2. **Second Normal Form (2NF):**
   * Every table uses a single-column surrogate primary key (`ID`), guaranteeing zero partial functional dependencies.
3. **Third Normal Form (3NF) & Derived Attributes:**
   * Authentication credentials (`users`) are separated from citizen demographic records (`residents`).
   * **Zero Update Anomaly on Age:** `Resident.Age` is marked `gorm:"-"` (not stored as a static column) and is dynamically calculated from `Birthdate` via GORM's `AfterFind` hook.
4. **Intentional Pragmatic Denormalizations:**
   * `Payment.PayorName`: Snapshots the payor's legal name at the exact time of Official Receipt issuance for COA/financial audit immutability.
   * `HealthRecord.ResidentName`: Cached for zero-join lookup speed during emergency triage.
   * `Blotter.HearingSchedules`: Stored as structured JSON to support flexible, multi-session conciliation dates.

---

## 📡 9. Complete REST API & WebSocket Reference

### 9.1. Public & Authentication Endpoints
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/ping` | Public | Health check probe (`{"message":"pong"}`) |
| `GET` | `/api/system/db-status` | Public | Active database engine & cloud connectivity status |
| `GET` | `/api/public/stats` | Public | Public transparency metrics for landing page |
| `GET` | `/api/settings/hotlines` | Public | Emergency hotline directory |
| `GET` | `/api/settings/fees` | Public | Official schedule of barangay document fees |
| `GET` | `/api/settings/clinic-schedule` | Public | Health center operating hours & duty nurse |
| `POST` | `/api/auth/login` | Public (Rate Limited) | Authenticate user & issue JWT |
| `POST` | `/api/auth/google` | Public (Rate Limited) | Google OAuth SSO authentication |
| `POST` | `/api/auth/register` | Public (Rate Limited) | Citizen registration with duplicate check |
| `POST` | `/api/auth/verify-otp` | Public (Rate Limited) | Verify 6-digit email OTP |
| `POST` | `/api/auth/forgot-password` | Public (Rate Limited) | Dispatch password reset OTP |
| `POST` | `/api/auth/reset-password` | Public (Rate Limited) | Reset password using valid OTP |
| `POST` | `/api/auth/refresh` | Public | Silent JWT token renewal |
| `GET` | `/api/verify/document/:hash` | Public | Verify QR authenticity of Certificate or Citizen ID |
| `POST` | `/api/public/certificates/request` | Public Kiosk | Walk-in kiosk certificate application & queue ticket |
| `POST` | `/api/dev/report-error` | Public | Frontend exception telemetry ingestion |
| `GET` | `/api/ws` | WebSocket | Real-time broadcast channel for notifications & queue |

### 9.2. Protected Citizen & Staff Endpoints (`Authorization: Bearer <token>`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` / `PUT` | `/api/auth/me` | Authenticated | Fetch or update current user profile |
| `POST` | `/api/auth/change-password` | Authenticated | Update account password |
| `POST` | `/api/ai/chat` | Authenticated | Context-aware AI assistant query |
| `GET` / `POST` | `/api/appointments` | Authenticated | List (scoped by role) or book appointments |
| `PUT` | `/api/appointments/:id/status` | Staff Only | Update booking status (`Confirmed`, `Completed`, `Cancelled`) |
| `GET` | `/api/appointments/congestion` | Authenticated | 7-day queue congestion forecast |
| `GET` / `POST` | `/api/certificates` | Authenticated | List or request barangay certificates |
| `POST` | `/api/certificates/:id/approve` | Staff Only | Approve and digitally sign certificate |
| `POST` | `/api/certificates/:id/reject` | Staff Only | Reject certificate request |
| `GET` / `POST` | `/api/residents` | Staff Only | Search, filter, or register residents |
| `PUT` / `DELETE`| `/api/residents/:id` | Staff Only | Update or archive resident profile |
| `POST` | `/api/residents/:id/reset-account`| Staff Only | Recover resident account & reset password |
| `GET` / `POST` | `/api/households` | Staff Only | List or create RBI household profiles |
| `POST` | `/api/households/assign-member` | Staff Only | Link resident to a household |
| `GET` / `POST` | `/api/blotters` | Staff Only | List or file confidential blotter cases |
| `PUT` / `DELETE`| `/api/blotters/:id` | Staff Only | Update hearing schedules, status, or delete case |
| `POST` | `/api/blotters/:id/summarize` | Staff Only | Generate AI legal mediation digest |
| `GET` / `POST` | `/api/businesses` | Staff Only | List or register commercial establishments |
| `GET` / `POST` | `/api/health-records` | Health / Staff | List or create patient clinical records |
| `POST` | `/api/health-records/:id/dispense`| Health / Staff | Dispense medicine & decrement inventory |
| `GET` / `POST` | `/api/medicine-stock` | Health / Staff | Manage pharmacy inventory batches |
| `GET` | `/api/payments` | Staff Only | View official fee collection ledger |
| `GET` | `/api/analytics/dashboard` | Staff Only | Aggregated demographic & revenue statistics |
| `GET` / `POST` | `/api/users/staff` | Admin / Captain | Manage barangay staff accounts & roles |
| `GET` / `DELETE`| `/api/dev/error-logs` | Developer Only | Inspect or purge full-stack error logs |
| `GET` | `/api/dev/audit-logs` | Developer Only | Inspect chronological user activity audit logs |

---

## 🚀 10. Local Setup & Deployment Guide

### Prerequisites
* **Node.js** `>= 20.x` and **npm**
* **Go (Golang)** `>= 1.24.x`
* **PostgreSQL** (optional locally; automatically falls back to embedded **SQLite** `lingkodbrgai.db` if `DATABASE_URL` is unreachable)

### 1. Clone the Repository
```bash
git clone https://github.com/a2b567/LingkodBrgAI.git
cd LingkodBrgAI
```

### 2. Backend Configuration & Startup
Create a `.env` file inside the `backend/` directory:
```env
PORT=8080
DATABASE_URL=postgresql://user:password@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres
JWT_SECRET=your_super_secret_jwt_signing_key
GROQ_API_KEY=gsk_your_groq_api_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

Start the Go backend server:
```bash
cd backend
go mod tidy
go run cmd/server/main.go
```
*The backend will listen on `http://localhost:8080` and automatically run GORM schema migrations.*

### 3. Frontend Configuration & Startup
Create a `.env` file inside the `frontend/` directory:
```env
VITE_API_URL=http://localhost:8080/api
VITE_GROQ_API_KEY=gsk_your_groq_api_key
VITE_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
```

Install dependencies and launch the Vite development server:
```bash
cd frontend
npm install
npm run dev
```
*The frontend will be accessible at `http://localhost:5173`.*

### 4. Production Build & Deployment
```bash
# Verify TypeScript & build production bundle
cd frontend
npm run build

# Deploy to Vercel Production
cd ..
npx vercel --prod --yes
```

---

## 📄 License & Governance
Developed for **Barangay Santa Cruz, Bay, Laguna**. Engineered with strict adherence to Philippine e-Governance standards and the **Data Privacy Act of 2012 (RA 10173)**.
