package config

import (
	"log"
	"os"
	"sync"

	"github.com/joho/godotenv"
)

type Config struct {
	Port        string
	DatabaseURL string
	DBHost      string
	DBUser      string
	DBPassword  string
	DBName      string
	DBPort      string
	DBSSLMode   string
	JWTSecret   string
	OpenAIKey   string
	GroqAPIKey  string
	UploadDir   string
}

var (
	cachedConfig *Config
	configOnce   sync.Once
)

func LoadConfig() *Config {
	configOnce.Do(func() {
		// Load .env file once at startup if it exists, otherwise rely on system env vars
		if err := godotenv.Load(); err != nil {
			log.Println("No .env file found or reading from existing environment variables")
		}

		dbURL := getEnv("DATABASE_URL", "")
		dbHost := getEnv("DB_HOST", "aws-0-ap-southeast-2.pooler.supabase.com")
		dbUser := getEnv("DB_USER", "postgres.axqnnlrtyjkmjsseizfz")
		dbPassword := getEnv("DB_PASSWORD", "NIKEniaranas")
		dbName := getEnv("DB_NAME", "postgres")
		dbPort := getEnv("DB_PORT", "6543")
		dbSSL := getEnv("DB_SSLMODE", "require")
		if dbHost == "localhost" || dbHost == "sqlite" {
			dbSSL = "disable"
		}

		groqKey := getEnv("GROQ_API_KEY", getEnv("VITE_GROQ_API_KEY", ""))
		openAIKey := getEnv("OPENAI_API_KEY", groqKey)

		cachedConfig = &Config{
			Port:        getEnv("PORT", "8080"),
			DatabaseURL: dbURL,
			DBHost:      dbHost,
			DBUser:      dbUser,
			DBPassword:  dbPassword,
			DBName:      dbName,
			DBPort:      dbPort,
			DBSSLMode:   dbSSL,
			JWTSecret:   getEnv("JWT_SECRET", "super_secret_barangay_key_2026"),
			OpenAIKey:   openAIKey,
			GroqAPIKey:  groqKey,
			UploadDir:   getEnv("UPLOAD_DIR", "./uploads"),
		}
	})
	return cachedConfig
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
