-- ==============================================================================
-- LingkodBrgyAI - Least Privilege PostgreSQL Database User Migration
-- Compliance: GovTech Security Standard & Data Privacy Act of 2012 (RA 10173)
-- ==============================================================================

-- 1. Create the application user with a strong password (Override in production via ENV)
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'lingkod_app_user') THEN
      CREATE USER lingkod_app_user WITH ENCRYPTED PASSWORD 'SecureAppUserPassword2026!';
   END IF;
END
$$;

-- 2. Revoke all default privileges from public schema
REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;

-- 3. Grant schema usage and SELECT, INSERT, UPDATE, DELETE only
GRANT USAGE ON SCHEMA public TO lingkod_app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO lingkod_app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO lingkod_app_user;

-- 4. Automatically grant DML privileges on future tables created by migrations
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO lingkod_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO lingkod_app_user;

-- 5. EXPLICITLY REVOKE DDL capabilities (No TRUNCATE, DROP, ALTER, CREATE, or REFERENCES)
REVOKE CREATE ON SCHEMA public FROM lingkod_app_user;
REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM lingkod_app_user;

-- ==============================================================================
-- GORM PostgreSQL DSN Connection String to use this restricted user:
-- postgres://lingkod_app_user:SecureAppUserPassword2026!@localhost:5432/lingkodbrgy?sslmode=require
-- ==============================================================================
