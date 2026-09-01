package config

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/url"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/storage"
	"google.golang.org/api/option"
)

var FirebaseStorageClient *storage.Client
var StorageBucketName string

// InitFirebase initializes the Firebase application and Storage client
func InitFirebase() error {
	ctx := context.Background()

	// Firebase configurations via env vars
	credsPath := getEnv("FIREBASE_CREDENTIALS_PATH", "firebase-adminsdk.json")
	bucketName := getEnv("FIREBASE_STORAGE_BUCKET", "your-project-id.appspot.com")
	StorageBucketName = bucketName

	opt := option.WithCredentialsFile(credsPath)
	config := &firebase.Config{
		StorageBucket: bucketName,
	}

	app, err := firebase.NewApp(ctx, config, opt)
	if err != nil {
		log.Printf("Firebase setup skipped or failed. Local uploads will be used if needed: %v", err)
		return err
	}

	client, err := app.Storage(ctx)
	if err != nil {
		log.Printf("Error initializing Firebase Storage client: %v", err)
		return err
	}

	FirebaseStorageClient = client
	log.Printf("Firebase Storage successfully initialized for bucket: %s", bucketName)
	return nil
}

// UploadFileToFirebase uploads a file to Firebase Storage and returns its public URL
func UploadFileToFirebase(ctx context.Context, destPath string, reader io.Reader, contentType string) (string, error) {
	if FirebaseStorageClient == nil {
		return "", fmt.Errorf("Firebase is not initialized")
	}

	bucket, err := FirebaseStorageClient.Bucket(StorageBucketName)
	if err != nil {
		return "", err
	}

	obj := bucket.Object(destPath)
	writer := obj.NewWriter(ctx)
	writer.ContentType = contentType

	if _, err := io.Copy(writer, reader); err != nil {
		writer.Close()
		return "", err
	}
	if err := writer.Close(); err != nil {
		return "", err
	}

	// Build the Firebase Storage public URL with proper path encoding
	encodedPath := url.PathEscape(destPath)
	publicURL := fmt.Sprintf("https://firebasestorage.googleapis.com/v0/b/%s/o/%s?alt=media", StorageBucketName, encodedPath)

	return publicURL, nil
}

