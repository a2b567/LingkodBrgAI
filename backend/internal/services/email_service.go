package services

import (
	"crypto/tls"
	"fmt"
	"log"
	"net/smtp"
	"os"
	"strconv"
	"strings"
	"time"
)

// EmailService handles real-world transactional email and OTP dispatching.
type EmailService struct {
	Host     string
	Port     int
	User     string
	Password string
	FromName string
}

var GlobalEmailService *EmailService

// InitEmailService initializes the global email delivery service from environment variables.
func InitEmailService() *EmailService {
	host := os.Getenv("SMTP_HOST")
	if host == "" {
		host = "smtp.gmail.com"
	}

	portStr := os.Getenv("SMTP_PORT")
	port := 587
	if p, err := strconv.Atoi(portStr); err == nil && p > 0 {
		port = p
	}

	user := os.Getenv("SMTP_USER")
	if user == "" {
		user = os.Getenv("SMTP_EMAIL")
	}

	pass := os.Getenv("SMTP_PASSWORD")
	if pass == "" {
		pass = os.Getenv("SMTP_APP_PASSWORD")
	}

	fromName := os.Getenv("SMTP_FROM_NAME")
	if fromName == "" {
		fromName = "LingkodBrgy AI - Barangay San Isidro"
	}

	svc := &EmailService{
		Host:     host,
		Port:     port,
		User:     user,
		Password: pass,
		FromName: fromName,
	}

	if svc.IsConfigured() {
		log.Printf("[EMAIL SERVICE] ✅ Live SMTP Service ready (Host: %s:%d, Sender: %s)", host, port, user)
	} else {
		log.Printf("[EMAIL SERVICE] ℹ️ SMTP credentials (SMTP_USER / SMTP_PASSWORD) not configured yet in backend/.env. Real OTPs will be securely simulated in terminal logs until credentials are provided.")
	}

	GlobalEmailService = svc
	return svc
}

// IsConfigured returns true if real SMTP sender credentials are provided.
func (s *EmailService) IsConfigured() bool {
	return s.User != "" && s.Password != ""
}

// SendOTPEmail sends a cryptographically generated 6-digit OTP code to the recipient via Email.
func (s *EmailService) SendOTPEmail(recipientEmail, recipientName, otpCode, purpose string) error {
	var subject string
	var purposeText string

	switch purpose {
	case "ACCOUNT_VERIFICATION":
		subject = fmt.Sprintf("Barangay Account Verification OTP: %s", otpCode)
		purposeText = "kumpirmahin at i-verify ang iyong bagong LingkodBrgy Barangay Citizen Account"
	case "PASSWORD_RESET":
		subject = fmt.Sprintf("LingkodBrgy Password Reset OTP: %s", otpCode)
		purposeText = "i-reset ang password ng iyong LingkodBrgy Barangay Account"
	default:
		subject = fmt.Sprintf("LingkodBrgy Security Verification OTP: %s", otpCode)
		purposeText = "kumpletuhin ang iyong opisyal na pag-login at transaksyon sa barangay"
	}

	textBody := fmt.Sprintf(
`LingkodBrgy AI — Barangay San Isidro GovTech Portal

Magandang araw, %s!

Ito ang iyong opisyal na One-Time Password (OTP) upang %s:

========================================
             %s
========================================

Ang code na ito ay may bisa lamang sa loob ng 10 MINUTO.

PAALALA SA SEGURIDAD (RA 10173):
Huwag ibahagi ang iyong OTP kaninuman. Ang mga kawani ng barangay at system administrator ay kailanman hindi hihingi ng iyong OTP.

Kung hindi ikaw ang humiling nito, agad itong i-report sa opisyal na Barangay Information Desk.

Barangay San Isidro, Bay, Laguna
LingkodBrgy Secure GovTech System
`, recipientName, purposeText, otpCode)

	htmlBody := fmt.Sprintf(`<!DOCTYPE html>
<html lang="tl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>%s</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%%" style="max-width: 560px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(15,23,42,0.08); border: 1px solid #e2e8f0;">
          
          <!-- Government Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%%, #1e40af 100%%); padding: 36px 30px; text-align: center;">
              <p style="margin: 0; color: #bfdbfe; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">Republika ng Pilipinas • Bayan ng Bay, Laguna</p>
              <h1 style="margin: 8px 0 0 0; color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">LINGKODBRGY AI</h1>
              <p style="margin: 4px 0 0 0; color: #93c5fd; font-size: 13px; font-weight: 600;">Barangay San Isidro Official GovTech Portal</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="margin: 0 0 12px 0; color: #0f172a; font-size: 18px; font-weight: 800;">Kumusta, %s!</h2>
              <p style="margin: 0 0 24px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                Nakatanggap kami ng opisyal na kahilingan upang <strong>%s</strong>. Gamitin ang One-Time Password (OTP) sa ibaba upang makumpleto ang proseso:
              </p>

              <!-- OTP Box -->
              <div style="background-color: #eff6ff; border: 2px dashed #3b82f6; border-radius: 16px; padding: 24px; text-align: center; margin: 28px 0;">
                <p style="margin: 0 0 8px 0; color: #1e40af; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">Iyong Verification Code (OTP)</p>
                <div style="font-size: 38px; font-weight: 900; letter-spacing: 12px; color: #1e3a8a; font-family: 'Courier New', Courier, monospace; padding-left: 12px;">%s</div>
                <p style="margin: 10px 0 0 0; color: #64748b; font-size: 12px; font-weight: 600;">Valid sa loob ng <strong>10 Minuto</strong> lamang</p>
              </div>

              <!-- Security Notice -->
              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 8px; padding: 14px 16px; margin: 24px 0;">
                <p style="margin: 0; color: #991b1b; font-size: 12px; font-weight: 700; line-height: 1.5;">
                  ⚠️ Babala sa Seguridad (RA 10173): Huwag kailanman ibahagi ang verification code na ito kaninuman. Ang mga kawani ng barangay ay HINDI magtatanong ng iyong OTP.
                </p>
              </div>

              <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                Kung hindi ikaw ang humiling ng verification code na ito, ligtas mong balewalain ang mensaheng ito. Ang iyong account ay mananatiling protektado.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center;">
              <p style="margin: 0; color: #64748b; font-size: 11px; font-weight: 600;">
                Protektado sa ilalim ng <strong>Republic Act 10173 (Data Privacy Act of 2012)</strong>
              </p>
              <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 10px;">
                Ipinadala ng LingkodBrgy Automated Authentication System • Barangay San Isidro, Bay, Laguna
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`, subject, recipientName, purposeText, otpCode)

	return s.SendMail(recipientEmail, subject, htmlBody, textBody)
}

// SendMail sends an email message via SMTP with MIME multipart/alternative support.
func (s *EmailService) SendMail(to, subject, htmlBody, textBody string) error {
	fromHeader := fmt.Sprintf("%s <%s>", s.FromName, s.User)
	if s.User == "" {
		fromHeader = fmt.Sprintf("%s <no-reply@lingkodbrgy.gov.ph>", s.FromName)
	}

	// Boundary for multipart/alternative
	boundary := fmt.Sprintf("boundary-%d", time.Now().UnixNano())

	var msg strings.Builder
	msg.WriteString(fmt.Sprintf("From: %s\r\n", fromHeader))
	msg.WriteString(fmt.Sprintf("To: %s\r\n", to))
	msg.WriteString(fmt.Sprintf("Subject: %s\r\n", subject))
	msg.WriteString("MIME-Version: 1.0\r\n")
	msg.WriteString(fmt.Sprintf("Content-Type: multipart/alternative; boundary=\"%s\"\r\n", boundary))
	msg.WriteString("\r\n")

	// Plain text part
	msg.WriteString(fmt.Sprintf("--%s\r\n", boundary))
	msg.WriteString("Content-Type: text/plain; charset=\"UTF-8\"\r\n")
	msg.WriteString("Content-Transfer-Encoding: 7bit\r\n\r\n")
	msg.WriteString(textBody)
	msg.WriteString("\r\n\r\n")

	// HTML part
	msg.WriteString(fmt.Sprintf("--%s\r\n", boundary))
	msg.WriteString("Content-Type: text/html; charset=\"UTF-8\"\r\n")
	msg.WriteString("Content-Transfer-Encoding: 7bit\r\n\r\n")
	msg.WriteString(htmlBody)
	msg.WriteString("\r\n\r\n")

	msg.WriteString(fmt.Sprintf("--%s--\r\n", boundary))

	if !s.IsConfigured() {
		// Log clearly to terminal
		log.Printf("\n=======================================================")
		log.Printf("[LIVE EMAIL DISPATCH - SIMULATED LOG]")
		log.Printf("To: %s", to)
		log.Printf("Subject: %s", subject)
		log.Printf("OTP Code: [Delivered via email template]")
		log.Printf("Notice: To send directly to your actual Gmail inbox, set SMTP_USER and SMTP_PASSWORD in backend/.env")
		log.Printf("=======================================================\n")
		return nil
	}

	addr := fmt.Sprintf("%s:%d", s.Host, s.Port)
	auth := smtp.PlainAuth("", s.User, s.Password, s.Host)

	// Port 465 (Direct TLS / SSL)
	if s.Port == 465 {
		tlsconfig := &tls.Config{
			ServerName: s.Host,
		}
		conn, err := tls.Dial("tcp", addr, tlsconfig)
		if err != nil {
			log.Printf("[EMAIL ERROR] TLS Dial error to %s: %v", addr, err)
			return fmt.Errorf("TLS Dial failed: %w", err)
		}
		defer conn.Close()

		c, err := smtp.NewClient(conn, s.Host)
		if err != nil {
			log.Printf("[EMAIL ERROR] SMTP Client init error: %v", err)
			return fmt.Errorf("SMTP client error: %w", err)
		}
		defer c.Quit()

		if err = c.Auth(auth); err != nil {
			log.Printf("[EMAIL ERROR] SMTP Auth failed: %v", err)
			return fmt.Errorf("SMTP auth failed: %w", err)
		}
		if err = c.Mail(s.User); err != nil {
			return fmt.Errorf("SMTP Mail-From failed: %w", err)
		}
		if err = c.Rcpt(to); err != nil {
			return fmt.Errorf("SMTP Rcpt-To failed: %w", err)
		}
		w, err := c.Data()
		if err != nil {
			return fmt.Errorf("SMTP Data open failed: %w", err)
		}
		if _, err = w.Write([]byte(msg.String())); err != nil {
			return fmt.Errorf("SMTP Data write failed: %w", err)
		}
		if err = w.Close(); err != nil {
			return fmt.Errorf("SMTP Data close failed: %w", err)
		}

		log.Printf("[EMAIL DELIVERED] ✅ Successfully sent live email via SSL to %s", to)
		return nil
	}

	// Port 587 (Standard STARTTLS)
	client, err := smtp.Dial(addr)
	if err != nil {
		log.Printf("[EMAIL ERROR] SMTP Dial error to %s: %v", addr, err)
		return fmt.Errorf("SMTP dial error: %w", err)
	}
	defer client.Quit()

	tlsconfig := &tls.Config{
		ServerName: s.Host,
	}
	if ok, _ := client.Extension("STARTTLS"); ok {
		if err = client.StartTLS(tlsconfig); err != nil {
			log.Printf("[EMAIL ERROR] StartTLS error: %v", err)
			return fmt.Errorf("StartTLS error: %w", err)
		}
	}

	if err = client.Auth(auth); err != nil {
		log.Printf("[EMAIL ERROR] SMTP Authentication error: %v", err)
		return fmt.Errorf("SMTP Auth error: %w", err)
	}
	if err = client.Mail(s.User); err != nil {
		return fmt.Errorf("SMTP Mail-From error: %w", err)
	}
	if err = client.Rcpt(to); err != nil {
		return fmt.Errorf("SMTP Rcpt-To error: %w", err)
	}

	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("SMTP Data writer error: %w", err)
	}
	if _, err = w.Write([]byte(msg.String())); err != nil {
		return fmt.Errorf("SMTP Write error: %w", err)
	}
	if err = w.Close(); err != nil {
		return fmt.Errorf("SMTP Close error: %w", err)
	}

	log.Printf("[EMAIL DELIVERED] ✅ Successfully sent live email via STARTTLS to %s", to)
	return nil
}

