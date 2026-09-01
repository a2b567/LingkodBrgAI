package redis

import (
	"context"
	"fmt"
	"log"
	"os"
	"sync"
	"time"

	redis "github.com/redis/go-redis/v9"
)

var (
	client *redis.Client
	once   sync.Once
	ctx    = context.Background()
)

// InitRedis initializes a singleton Redis client using REDIS_URL or host/port configuration.
func InitRedis() *redis.Client {
	once.Do(func() {
		redisURL := os.Getenv("REDIS_URL")
		var opts *redis.Options

		if redisURL != "" {
			var err error
			opts, err = redis.ParseURL(redisURL)
			if err != nil {
				log.Printf("CRITICAL: Invalid REDIS_URL '%s': %v. Falling back to default localhost:6379", redisURL, err)
				opts = &redis.Options{Addr: "localhost:6379"}
			}
		} else {
			host := os.Getenv("REDIS_HOST")
			if host == "" {
				host = "localhost"
			}
			port := os.Getenv("REDIS_PORT")
			if port == "" {
				port = "6379"
			}
			password := os.Getenv("REDIS_PASSWORD")

			opts = &redis.Options{
				Addr:     fmt.Sprintf("%s:%s", host, port),
				Password: password,
				DB:       0,
			}
		}

		// Configure timeouts
		opts.DialTimeout = 3 * time.Second
		opts.ReadTimeout = 2 * time.Second
		opts.WriteTimeout = 2 * time.Second

		client = redis.NewClient(opts)

		// Test Ping
		pingCtx, cancel := context.WithTimeout(ctx, 2*time.Second)
		defer cancel()

		if err := client.Ping(pingCtx).Err(); err != nil {
			log.Printf("WARNING: Redis connection failed: %v. Security limiters will fail-open.", err)
		} else {
			log.Println("SUCCESS: Connected to Redis server successfully.")
		}
	})

	return client
}

// GetClient returns the initialized singleton Redis client instance.
func GetClient() *redis.Client {
	if client == nil {
		return InitRedis()
	}
	return client
}

// IsAvailable checks if the Redis server is currently responding to ping commands.
func IsAvailable() bool {
	if client == nil {
		return false
	}
	pingCtx, cancel := context.WithTimeout(ctx, 500*time.Millisecond)
	defer cancel()
	return client.Ping(pingCtx).Err() == nil
}
