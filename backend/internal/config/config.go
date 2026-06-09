package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port         string
	DBHost       string
	DBUser       string
	DBPassword   string
	DBName       string
	DBPort       string
	DBSSLMode    string
	JWTSecret    string
	OpenAIKey    string
	UploadDir    string
}

func LoadConfig() *Config {
	// Load .env file if it exists, otherwise rely on system env vars
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, reading from environment variables")
	}

	return &Config{
		Port:         getEnv("PORT", "8080"),
		DBHost:       getEnv("DB_HOST", "localhost"),
		DBUser:       getEnv("DB_USER", "postgres"),
		DBPassword:   getEnv("DB_PASSWORD", "postgres"),
		DBName:       getEnv("DB_NAME", "bmis"),
		DBPort:       getEnv("DB_PORT", "5432"),
		DBSSLMode:    getEnv("DB_SSLMODE", "disable"),
		JWTSecret:    getEnv("JWT_SECRET", "super_secret_barangay_key_2026"),
		OpenAIKey:    getEnv("OPENAI_API_KEY", ""),
		UploadDir:    getEnv("UPLOAD_DIR", "./uploads"),
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

// GetEnvPublic is the exported version of getEnv for use by other packages
func GetEnvPublic(key, fallback string) string {
	return getEnv(key, fallback)
}

