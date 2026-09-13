package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port         string
	DatabaseURL  string
	DBHost       string
	DBUser       string
	DBPassword   string
	DBName       string
	DBPort       string
	DBSSLMode    string
	JWTSecret    string
	OpenAIKey    string
	GroqAPIKey   string
	UploadDir    string
}

func LoadConfig() *Config {
	// Load .env file if it exists, otherwise rely on system env vars
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found or reading from existing environment variables")
	}

	dbURL := getEnv("DATABASE_URL", getEnv("POSTGRES_URL", getEnv("POSTGRES_PRISMA_URL", getEnv("POSTGRES_URL_NON_POOLING", ""))))

	dbHost := getEnv("DB_HOST", getEnv("POSTGRES_HOST", getEnv("POSTGRES_PGHOST", "")))
	if dbHost == "" && dbURL == "" {
		dbHost = "localhost"
	}

	dbUser := getEnv("DB_USER", getEnv("POSTGRES_USER", getEnv("POSTGRES_PGUSER", "postgres")))
	dbPassword := getEnv("DB_PASSWORD", getEnv("POSTGRES_PASSWORD", getEnv("POSTGRES_PGPASSWORD", "postgres")))
	dbName := getEnv("DB_NAME", getEnv("POSTGRES_DATABASE", getEnv("POSTGRES_PGDATABASE", "lingkodbrgai")))
	dbPort := getEnv("DB_PORT", getEnv("POSTGRES_PORT", "5432"))

	dbSSL := getEnv("DB_SSLMODE", "")
	if dbSSL == "" {
		if dbHost != "localhost" && dbHost != "sqlite" && dbHost != "" {
			dbSSL = "require"
		} else {
			dbSSL = "disable"
		}
	}

	groqKey := getEnv("GROQ_API_KEY", getEnv("VITE_GROQ_API_KEY", ""))
	openAIKey := getEnv("OPENAI_API_KEY", groqKey)

	return &Config{
		Port:         getEnv("PORT", "8080"),
		DatabaseURL:  dbURL,
		DBHost:       dbHost,
		DBUser:       dbUser,
		DBPassword:   dbPassword,
		DBName:       dbName,
		DBPort:       dbPort,
		DBSSLMode:    dbSSL,
		JWTSecret:    getEnv("JWT_SECRET", "super_secret_barangay_key_2026"),
		OpenAIKey:    openAIKey,
		GroqAPIKey:   groqKey,
		UploadDir:    getEnv("UPLOAD_DIR", "./uploads"),
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists && value != "" {
		return value
	}
	return fallback
}

// GetEnvPublic is the exported version of getEnv for use by other packages
func GetEnvPublic(key, fallback string) string {
	return getEnv(key, fallback)
}


