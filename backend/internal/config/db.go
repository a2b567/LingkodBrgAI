package config

import (
	"fmt"
	"log"
	"time"

	"backend/internal/models"
	"github.com/glebarez/sqlite"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB(cfg *Config) (*gorm.DB, error) {
	var db *gorm.DB
	var err error

	if cfg.DBHost == "sqlite" {
		log.Println("Connecting to SQLite database (bmis.db)...")
		db, err = gorm.Open(sqlite.Open("bmis.db"), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
		if err != nil {
			return nil, fmt.Errorf("could not connect to SQLite database: %w", err)
		}
	} else {
		dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=Asia/Manila",
			cfg.DBHost, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBPort, cfg.DBSSLMode)

		// Retry connection for database startup in docker-compose setups
		for i := 1; i <= 3; i++ {
			db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
				Logger: logger.Default.LogMode(logger.Info),
			})
			if err == nil {
				break
			}
			log.Printf("Failed to connect to PostgreSQL (attempt %d/3): %v. Retrying in 2 seconds...", i, err)
			time.Sleep(2 * time.Second)
		}

		if err != nil {
			log.Println("PostgreSQL connection failed. Falling back to SQLite local database (bmis.db)...")
			db, err = gorm.Open(sqlite.Open("bmis.db"), &gorm.Config{
				Logger: logger.Default.LogMode(logger.Info),
			})
			if err != nil {
				return nil, fmt.Errorf("could not connect to SQLite fallback database: %w", err)
			}
		}
	}

	log.Println("Connected to database successfully.")

	// Auto-Migrate Schemas
	err = db.AutoMigrate(
		&models.User{},
		&models.Resident{},
		&models.Household{},
		&models.Certificate{},
		&models.Blotter{},
		&models.Business{},
		&models.Appointment{},
		&models.Notification{},
		&models.Payment{},
		&models.AuditLog{},
		&models.AILog{},
	)
	if err != nil {
		return nil, fmt.Errorf("auto-migration failed: %w", err)
	}

	log.Println("Database migration completed.")
	DB = db
	return db, nil
}
