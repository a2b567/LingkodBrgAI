package middleware

import (
	"github.com/gin-gonic/gin"
)

// SecurityHeadersMiddleware sets strict production-grade HTTP security headers for GovTech compliance.
func SecurityHeadersMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// HTTP Strict Transport Security (HSTS) - Force HTTPS for 1 year with subdomains & preloading
		c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")

		// Prevent Clickjacking attacks by forbidding embedding in frames/iframes
		c.Header("X-Frame-Options", "DENY")

		// Prevent MIME-type sniffing
		c.Header("X-Content-Type-Options", "nosniff")

		// Enable XSS Protection filter in legacy browsers
		c.Header("X-XSS-Protection", "1; mode=block")

		// Referrer Policy: Restrict cross-origin referrer leakage
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")

		// Permissions Policy: Restrict browser hardware access
		c.Header("Permissions-Policy", "geolocation=(), microphone=(), camera=()")

		// Content Security Policy (CSP) for GovTech compliance
		c.Header("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' wss: https:;")

		c.Next()
	}
}
