package services

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	"backend/internal/models"
	"github.com/jung-kurt/gofpdf"
)

type PDFService struct{}

func (s *PDFService) GenerateCertificate(cert models.Certificate) (string, error) {
	uploadsDir := "./uploads/certificates"
	if err := os.MkdirAll(uploadsDir, os.ModePerm); err != nil {
		return "", err
	}

	filename := fmt.Sprintf("%s.pdf", cert.DocumentNumber)
	filePath := filepath.Join(uploadsDir, filename)

	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(20, 20, 20)
	pdf.AddPage()

	// Watermark on printed document
	pdf.SetFont("Arial", "B", 36)
	pdf.SetTextColor(240, 240, 240) // Light watermark gray
	pdf.TransformBegin()
	pdf.TransformRotate(35, 100, 140)
	pdf.Text(25, 140, "DEV LAWREENE B ARANAS")
	pdf.TransformEnd()

	// Draw Border
	pdf.SetLineWidth(0.5)
	pdf.SetDrawColor(0, 0, 128) // Navy blue border
	pdf.Rect(10, 10, 190, 277, "D")

	// Header - Letterhead
	pdf.SetFont("Arial", "B", 10)
	pdf.SetTextColor(0, 0, 0)
	pdf.CellFormat(0, 5, "REPUBLIC OF THE PHILIPPINES", "0", 1, "C", false, 0, "")
	pdf.CellFormat(0, 5, "PROVINCE OF LAGUNA", "0", 1, "C", false, 0, "")
	pdf.CellFormat(0, 5, "MUNICIPALITY OF LAWRENCE", "0", 1, "C", false, 0, "")
	pdf.CellFormat(0, 6, "BARANGAY LAWRENCE", "0", 1, "C", false, 0, "")
	
	pdf.Ln(2)
	pdf.SetLineWidth(1)
	pdf.SetDrawColor(128, 0, 0) // Crimson line
	pdf.Line(15, 35, 195, 35)
	pdf.Ln(8)

	// Document Title
	pdf.SetFont("Arial", "BU", 18)
	pdf.SetTextColor(0, 0, 128)
	title := "OFFICE OF THE BARANGAY CAPTAIN"
	pdf.CellFormat(0, 8, title, "0", 1, "C", false, 0, "")
	pdf.Ln(4)

	pdf.SetFont("Arial", "B", 14)
	pdf.SetTextColor(128, 0, 0)
	certType := ""
	switch cert.Type {
	case "Clearance":
		certType = "BARANGAY CLEARANCE"
	case "Indigency":
		certType = "CERTIFICATE OF INDIGENCY"
	case "Residency":
		certType = "CERTIFICATE OF RESIDENCY"
	case "Business":
		certType = "BARANGAY BUSINESS PERMIT CLEARANCE"
	case "Cedula":
		certType = "COMMUNITY TAX CERTIFICATE (CEDULA)"
	default:
		certType = "CERTIFICATION"
	}
	pdf.CellFormat(0, 8, certType, "0", 1, "C", false, 0, "")
	pdf.Ln(8)

	// Salutation
	pdf.SetFont("Arial", "", 11)
	pdf.SetTextColor(0, 0, 0)
	pdf.CellFormat(0, 6, "TO WHOM IT MAY CONCERN:", "0", 1, "L", false, 0, "")
	pdf.Ln(6)

	// Body text
	residentName := fmt.Sprintf("%s %s %s %s", cert.Resident.FirstName, cert.Resident.MiddleName, cert.Resident.LastName, cert.Resident.Suffix)
	bodyText := ""

	switch cert.Type {
	case "Clearance":
		bodyText = fmt.Sprintf("This is to certify that %s, of legal age, %s, Filipino citizen, is a bonafide resident of %s, Barangay Lawrence.", residentName, cert.Resident.CivilStatus, cert.Resident.Address)
		bodyText += "\n\nBased on records available in this office, the aforementioned individual has no derogatory record and is a law-abiding citizen of this community."
		bodyText += fmt.Sprintf("\n\nThis clearance is being issued upon request of the interested party for the purpose of: %s.", cert.Purpose)
	case "Indigency":
		bodyText = fmt.Sprintf("This is to certify that %s, of legal age, %s, Filipino citizen, is a resident of %s, Barangay Lawrence.", residentName, cert.Resident.CivilStatus, cert.Resident.Address)
		bodyText += "\n\nIt is further certified that the family belongs to the low-income/indigent bracket of this Barangay, earning below the sustenance margin."
		bodyText += fmt.Sprintf("\n\nThis certification is being issued upon request of the interested party for the purpose of: %s.", cert.Purpose)
	case "Residency":
		bodyText = fmt.Sprintf("This is to certify that %s, of legal age, %s, Filipino citizen, is a resident of %s, Barangay Lawrence.", residentName, cert.Resident.CivilStatus, cert.Resident.Address)
		bodyText += fmt.Sprintf("\n\nIt is certified that the resident has lived in this barangay since %s.", cert.Resident.CreatedAt.Format("January 2006"))
		bodyText += fmt.Sprintf("\n\nThis certificate is being issued upon request of the interested party for: %s.", cert.Purpose)
	case "Business":
		bodyText = fmt.Sprintf("This is to certify that the business owned by %s, located at %s, Barangay Lawrence, has cleared all standard barangay inspections.", residentName, cert.Resident.Address)
		bodyText += "\n\nThis office poses no objection to the operation of the business provided standard public ordinances and laws are upheld."
		bodyText += fmt.Sprintf("\n\nIssued for: %s.", cert.Purpose)
	default:
		bodyText = fmt.Sprintf("This is to certify that %s is a registered resident of Barangay Lawrence, located in Laguna Province.", residentName)
		bodyText += fmt.Sprintf("\n\nIssued for: %s.", cert.Purpose)
	}

	pdf.MultiCell(0, 6.5, bodyText, "", "L", false)
	pdf.Ln(12)

	// Date Issued
	issueDate := time.Now()
	if cert.IssueDate != nil {
		issueDate = *cert.IssueDate
	}
	pdf.SetFont("Arial", "", 11)
	dateText := fmt.Sprintf("Given this %s day of %s, 2026, at the Office of the Barangay Captain, Barangay Lawrence, Laguna, Philippines.", 
		ordinal(issueDate.Day()), issueDate.Format("January"))
	pdf.MultiCell(0, 6, dateText, "", "L", false)
	pdf.Ln(25)

	// Signature Area
	pdf.SetFont("Arial", "B", 12)
	pdf.CellFormat(0, 5, "HON. JUAN DELA CRUZ", "0", 1, "R", false, 0, "")
	pdf.SetFont("Arial", "I", 10)
	pdf.CellFormat(0, 5, "Barangay Captain", "0", 1, "R", false, 0, "")

	// Embedded Verification QR
	qrPath := filepath.Join("./uploads/qr", fmt.Sprintf("%s.png", cert.ResidentID))
	if _, err := os.Stat(qrPath); err == nil {
		pdf.ImageOptions(qrPath, 15, 230, 35, 35, false, gofpdf.ImageOptions{ImageType: "PNG", ReadDpi: true}, 0, "")
	}

	// Verification Footer Notice
	pdf.SetFont("Arial", "", 8)
	pdf.SetTextColor(128, 128, 128)
	pdf.SetXY(15, 268)
	pdf.CellFormat(0, 4, fmt.Sprintf("Document No: %s | QR Verified Hash: %s", cert.DocumentNumber, cert.QRHash), "0", 1, "L", false, 0, "")
	pdf.CellFormat(0, 4, "Any alteration voids this document. Scan QR code to verify authenticity.", "0", 1, "L", false, 0, "")

	// Save
	if err := pdf.OutputFileAndClose(filePath); err != nil {
		return "", err
	}

	return "/uploads/certificates/" + filename, nil
}

func ordinal(x int) string {
	suffix := "th"
	switch x % 10 {
	case 1:
		if x%100 != 11 {
			suffix = "st"
		}
	case 2:
		if x%100 != 12 {
			suffix = "nd"
		}
	case 3:
		if x%100 != 13 {
			suffix = "rd"
		}
	}
	return fmt.Sprintf("%d%s", x, suffix)
}
