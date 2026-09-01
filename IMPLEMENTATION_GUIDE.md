# 🛡️ LingkodBrgyAI — Advanced GovTech Security Architecture Manual

This document provides a step-by-step implementation guide for retrofitting production-grade GovTech security layers into **LingkodBrgyAI**.

---

## 1. ⚙️ Strict Middleware Pipeline Order (`routes.go`)

Your application routes executed in `backend/internal/routes/routes.go` must adhere to this strict execution hierarchy:

```
[Incoming Request]
       │
       ▼
 1. SecurityHeadersMiddleware (HSTS, CSP, X-Frame-Options, CORS)
       │
       ▼
 2. KioskPublicRateLimiter (Redis Sliding Window: Max 100 req/min per IP)
       │
       ▼
 3. StrictAuthMiddleware (Forces 'Authorization: Bearer <token>', rejects ?token= queries, checks Canary Traps & Impossible Travel)
       │
       ▼
 4. RBAC Middleware (RequireRoles for Captain, Secretary, Health Worker)
       │
       ▼
 5. AuthenticatedUserRateLimiter (Redis Sliding Window: Max 500 req/min per UserID)
       │
       ▼
 6. IdempotencyMiddleware (Reads 'Idempotency-Key', returns cached 200 OK for 24h)
       │
       ▼
 7. StrictJSONMiddleware (Rejects extra undeclared JSON payload fields)
       │
       ▼
 8. AsyncAuditLogger (Non-blocking async channel logger for legal compliance)
       │
       ▼
 [Target Handler / PDF Generation]
```

---

## 2. 🗄️ Database Least-Privilege Setup (PostgreSQL)

To comply with the Philippine Data Privacy Act of 2012 (RA 10173), the application must run under a restricted database user without DDL capabilities.

### Run Migration:
```bash
psql -U postgres -d lingkodbrgy -f db/migrations/002_create_restricted_app_user.sql
```

### Updated GORM Connection String (DSN):
```env
# .env Configuration
DB_DRIVER=postgres
DB_DSN=postgres://lingkod_app_user:SecureAppUserPassword2026!@localhost:5432/lingkodbrgy?sslmode=require
```

---

## 3. 🚀 Security Infrastructure Setup (Docker Compose)

Start the production Redis instance (Sliding Window & Idempotency) and HashiCorp Vault (KMS):

```bash
docker-compose -f docker-compose.security.yml up -d
```

### Environment Variables (.env):
```env
# Redis Configuration
REDIS_URL=redis://:LingkodRedisSecret2026!@localhost:6379/0

# JWT Configuration
JWT_SECRET=super-secret-govtech-key-change-in-production-2026
```

---

## 4. 🔒 Critical Fix: Rejection of Query-String Authentication

The old query parameter fallback (`?token=...` or `?Authorization=...`) has been **strictly disabled** in `StrictAuthMiddleware`.

### Behavior:
- **Request with `?token=...`**: Immediately rejected with `HTTP 400 Bad Request` and message: `"Query parameter authentication is disabled for security."`
- **Request with `Authorization: Bearer <token>`**: Validated normally.

---

## 5. 🎯 Security Features Overview

| Feature | Component | Behavior |
|---|---|---|
| **Canary Honeypot Trap** | `auth_jwt.go` | Detects tokens like `sk-canary-public1`. Returns `418 I'm a teapot` & blacklists IP for 1 hour. |
| **Impossible Travel Anomaly** | `auth_jwt.go` | Triggers if a user moves > 500 km in < 2 hours. Revokes JWT `jti` in Redis & returns `403`. |
| **Redis Sliding Window** | `rate_limiter.go` | Uses `ZADD`/`ZREMRANGEBYSCORE` for 100 req/min (kiosk) & 500 req/min (admin). **Fail-Open if Redis drops**. |
| **Idempotency Key** | `idempotency.go` | Caches PDF responses under `idempotent:{user_id}:{key}` for 24 hours. |
| **Async Audit Trail** | `audit_logger.go` | Non-blocking buffered channel logging non-PII JSON structs to stdout. |
