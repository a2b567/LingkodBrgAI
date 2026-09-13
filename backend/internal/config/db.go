package config

import (
	"fmt"
	"log"
	"os"
	"time"

	"backend/internal/models"
	"github.com/glebarez/sqlite"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// DB represents the Primary Local Database (SQLite) for ultra-fast, offline-first operations.
var DB *gorm.DB

// CloudDB represents the Secondary Cloud Sync Database (PostgreSQL / Cloud SQLite) for cloud backup and remote access.
var CloudDB *gorm.DB

type DBStatusResponse struct {
	LocalDB  DBInfo `json:"local_database"`
	CloudDB  DBInfo `json:"cloud_database"`
	Synced   bool   `json:"is_synced"`
}

type DBInfo struct {
	Type   string `json:"type"`
	Target string `json:"target"`
	Status string `json:"status"`
}

func InitDB(cfg *Config) (*gorm.DB, error) {
	var err error

	// 1. Check if Cloud Database (PostgreSQL) is configured
	hasCloudConfig := cfg.DatabaseURL != "" || (cfg.DBHost != "" && cfg.DBHost != "sqlite" && cfg.DBHost != "localhost")
	cloudPath := "lingkodbrgai_cloud.db"
	if os.Getenv("VERCEL") == "1" {
		cloudPath = "/tmp/lingkodbrgai_cloud.db"
	}

	if hasCloudConfig {
		if cfg.DatabaseURL != "" {
			log.Printf("[CLOUD DB] Connecting to Remote PostgreSQL using Database URL...")
			for i := 1; i <= 3; i++ {
				CloudDB, err = gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{
					Logger:                                   logger.Default.LogMode(logger.Warn),
					DisableForeignKeyConstraintWhenMigrating: true,
				})
				if err == nil {
					break
				}
				log.Printf("[CLOUD DB] Connection attempt %d/3 failed: %v. Retrying in 2s...", i, err)
				time.Sleep(2 * time.Second)
			}
		} else {
			dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=Asia/Manila",
				cfg.DBHost, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBPort, cfg.DBSSLMode)

			log.Printf("[CLOUD DB] Connecting to Remote PostgreSQL Cloud Database (%s:%s)...", cfg.DBHost, cfg.DBPort)
			for i := 1; i <= 3; i++ {
				CloudDB, err = gorm.Open(postgres.New(postgres.Config{
					DSN:                  dsn,
					PreferSimpleProtocol: true,
				}), &gorm.Config{
					Logger:                                   logger.Default.LogMode(logger.Info),
					DisableForeignKeyConstraintWhenMigrating: true,
				})
				if err == nil {
					break
				}
				log.Printf("[CLOUD DB] Connection attempt %d/3 failed: %v. Retrying in 2s...", i, err)
				time.Sleep(2 * time.Second)
			}
		}

		if err != nil {
			log.Printf("[CLOUD DB] Remote PostgreSQL connection unavailable: %v. Initializing local Cloud Mirror DB (%s)...", err, cloudPath)
			CloudDB, _ = gorm.Open(sqlite.Open(cloudPath), &gorm.Config{
				Logger: logger.Default.LogMode(logger.Warn),
			})
		}
	} else {
		log.Printf("[CLOUD DB] Initializing Secondary Hybrid Cloud DB (%s)...", cloudPath)
		CloudDB, err = gorm.Open(sqlite.Open(cloudPath), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
		if err != nil {
			log.Printf("[CLOUD DB] Secondary DB init error: %v", err)
		}
	}

	// Auto-Migrate Cloud Database if active
	if CloudDB != nil {
		_ = CloudDB.AutoMigrate(&models.Household{})
		if migrateErr := CloudDB.AutoMigrate(
			&models.Resident{},
			&models.User{},
			&models.Certificate{},
			&models.Blotter{},
			&models.Business{},
			&models.Appointment{},
			&models.Notification{},
			&models.Payment{},
			&models.AuditLog{},
			&models.AILog{},
			&models.QueueTicket{},
			&models.License{},
			&models.MedicineStock{},
			&models.HealthRecord{},
			&models.DispensedItem{},
		); migrateErr != nil {
			log.Printf("[CLOUD DB ERROR] Cloud Database migration error: %v", migrateErr)
		} else {
			log.Println("[CLOUD DB] Cloud Database migration completed successfully.")
		}
	}

	// In serverless environment (Vercel) or when CloudDB is live PostgreSQL, use CloudDB as primary DB
	if CloudDB != nil && (os.Getenv("VERCEL") == "1" || (hasCloudConfig && err == nil)) {
		DB = CloudDB
		log.Println("[PRIMARY DB] Operating in Cloud PostgreSQL mode as Primary DB.")
		return DB, nil
	}

	// 2. Initialize Primary Local Database (SQLite) for offline-first local mode
	localPath := "lingkodbrgai.db"
	if os.Getenv("VERCEL") == "1" {
		localPath = "/tmp/lingkodbrgai.db"
	}

	log.Printf("[LOCAL DB] Connecting to Primary Local Database (%s)...", localPath)
	DB, err = gorm.Open(sqlite.Open(localPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		if CloudDB != nil {
			DB = CloudDB
			return DB, nil
		}
		return nil, fmt.Errorf("could not connect to Local SQLite DB: %w", err)
	}
	log.Println("[LOCAL DB] Primary Local Database connected successfully.")

	// Auto-Migrate Schemas on Local DB
	_ = DB.AutoMigrate(&models.Household{})
	err = DB.AutoMigrate(
		&models.Resident{},
		&models.User{},
		&models.Certificate{},
		&models.Blotter{},
		&models.Business{},
		&models.Appointment{},
		&models.Notification{},
		&models.Payment{},
		&models.AuditLog{},
		&models.AILog{},
		&models.QueueTicket{},
		&models.License{},
		&models.MedicineStock{},
		&models.HealthRecord{},
		&models.DispensedItem{},
	)
	if err != nil {
		log.Printf("[LOCAL DB WARNING] Local DB auto-migration warning: %v", err)
	} else {
		log.Println("[LOCAL DB] Primary Local Database migration completed.")
	}

	return DB, nil
}

// SyncToCloud asynchronously syncs/saves entities to the Cloud DB in the background
func SyncToCloud(value interface{}) {
	if CloudDB == nil {
		return
	}
	go func() {
		if err := CloudDB.Save(value).Error; err != nil {
			log.Printf("[HYBRID SYNC WARNING] Failed to mirror entity to Cloud DB: %v", err)
		} else {
			log.Println("[HYBRID SYNC SUCCESS] Entity successfully mirrored to Cloud DB.")
		}
	}()
}

// GetDBStatus returns the current health status of both local and cloud databases
func GetDBStatus() DBStatusResponse {
	localStatus := "offline"
	if DB != nil {
		sqlDB, err := DB.DB()
		if err == nil && sqlDB.Ping() == nil {
			localStatus = "online (Primary)"
		}
	}

	cloudStatus := "offline"
	cloudTarget := "lingkodbrgai_cloud.db"
	if CloudDB != nil {
		sqlDB, err := CloudDB.DB()
		if err == nil && sqlDB.Ping() == nil {
			cloudStatus = "online (Secondary Sync)"
		}
	}

	return DBStatusResponse{
		LocalDB: DBInfo{
			Type:   "SQLite (Offline-First)",
			Target: "lingkodbrgai.db",
			Status: localStatus,
		},
		CloudDB: DBInfo{
			Type:   "PostgreSQL / Cloud SQLite",
			Target: cloudTarget,
			Status: cloudStatus,
		},
		Synced: DB != nil && CloudDB != nil,
	}
}
