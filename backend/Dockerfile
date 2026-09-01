# Build stage
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build high-performance statically linked binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o server cmd/server/main.go

# Production stage
FROM alpine:3.19

# Install ca-certificates for secure API outgoing requests
RUN apk --no-cache add ca-certificates

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/server .
# Copy environment configuration template if needed, else docker-compose will inject it
COPY --from=builder /app/.env .

# Create directory structures for uploads
RUN mkdir -p uploads/photos uploads/certificates uploads/qr

EXPOSE 8080

CMD ["./server"]
