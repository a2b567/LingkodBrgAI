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
	client    *redis.Client
	available bool
	once      sync.Once
	ctx       = context.Background()
)

// InitRedis initializes a singleton Redis client when REDIS_URL or REDIS_HOST is configured.
func InitRedis() *redis.Client {
	once.Do(func() {
		redisURL := os.Getenv("REDIS_URL")
		host := os.Getenv("REDIS_HOST")

		// Skip Redis connection attempt if no Redis server is configured (zero latency fail-open)
		if redisURL == "" && host == "" {
			available = false
			return
		}

		var opts *redis.Options
		if redisURL != "" {
			var err error
			opts, err = redis.ParseURL(redisURL)
			if err != nil {
				log.Printf("WARNING: Invalid REDIS_URL: %v. Security limiters will fail-open.", err)
				available = false
				return
			}
		} else {
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

		opts.DialTimeout = 1 * time.Second
		opts.ReadTimeout = 1 * time.Second
		opts.WriteTimeout = 1 * time.Second

		c := redis.NewClient(opts)

		pingCtx, cancel := context.WithTimeout(ctx, 1*time.Second)
		defer cancel()

		if err := c.Ping(pingCtx).Err(); err != nil {
			log.Printf("WARNING: Redis connection failed: %v. Security limiters will fail-open.", err)
			available = false
			_ = c.Close()
		} else {
			log.Println("SUCCESS: Connected to Redis server successfully.")
			client = c
			available = true
		}
	})

	return client
}

// GetClient returns the initialized singleton Redis client instance.
func GetClient() *redis.Client {
	InitRedis()
	return client
}

// IsAvailable returns true in O(1) memory time only when a Redis server is connected.
func IsAvailable() bool {
	InitRedis()
	return available && client != nil
}
