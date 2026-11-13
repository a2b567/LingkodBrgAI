import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, name, otp, purpose, secret } = req.body || {};

  const EXPECTED_SECRET = 'lingkodbrgy_otp_secret_key_2026';
  if (secret !== EXPECTED_SECRET) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  if (!to || !otp) {
    return res.status(400).json({ error: 'Missing to or otp parameter' });
  }

  const recipientName = name || 'Residente';
  let subject = `LingkodBrgy Security Verification OTP: ${otp}`;
  let purposeText = 'kumpirmahin at i-verify ang iyong LingkodBrgy Account';

  if (purpose === 'PASSWORD_RESET') {
    subject = `LingkodBrgy Password Reset OTP: ${otp}`;
    purposeText = 'i-reset ang password ng iyong LingkodBrgy Barangay Account';
  } else if (purpose === 'ACCOUNT_VERIFICATION') {
    subject = `Barangay Account Verification OTP: ${otp}`;
    purposeText = 'kumpirmahin at i-verify ang iyong bagong LingkodBrgy Barangay Citizen Account';
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #0b1120; color: #ffffff; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 12px; padding: 30px; border: 1px solid #1e293b;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h2 style="color: #38bdf8; margin: 0;">LingkodBrgy AI</h2>
      <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">Barangay San Isidro GovTech Operations Portal</p>
    </div>
    
    <p style="font-size: 16px; color: #e2e8f0;">Magandang araw, <strong>${recipientName}</strong>,</p>
    
    <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
      Natanggap namin ang iyong kahilingan upang ${purposeText}. Gamitin ang One-Time Password (OTP) sa ibaba upang makumpleto ang proseso:
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <div style="display: inline-block; background: #1e293b; border: 2px dashed #38bdf8; padding: 16px 36px; border-radius: 10px;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #38bdf8; font-family: monospace;">${otp}</span>
      </div>
      <p style="color: #f59e0b; font-size: 12px; margin-top: 10px;">⚠️ Valid lamang ang code na ito sa loob ng 15 minuto.</p>
    </div>

    <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">
      Kung hindi ikaw ang nag-request nito, huwag pansinin ang mensaheng ito at tiyaking ligtas ang iyong account. Huwag ibahagi ang code na ito kaninuman.
    </p>

    <div style="border-top: 1px solid #1e293b; margin-top: 24px; padding-top: 16px; text-align: center; font-size: 11px; color: #64748b;">
      <p>© 2026 LingkodBrgy AI — Official Barangay Management System</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const smtpUser = process.env.SMTP_USER || process.env.SMTP_EMAIL || 'low22708@gmail.com';
    const smtpPass = process.env.SMTP_PASSWORD || process.env.SMTP_APP_PASSWORD || 'hqugtizxudylilue';

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({
      from: `"LingkodBrgy AI - Barangay San Isidro" <${smtpUser}>`,
      to,
      subject,
      html: htmlContent,
      text: `Magandang araw ${recipientName},\n\nAng iyong LingkodBrgy OTP verification code ay: ${otp}\n\nValid ito sa loob ng 15 minuto.`,
    });

    console.log(`[VERCEL SMTP SUCCESS] Successfully delivered OTP to ${to}`);
    return res.status(200).json({ success: true, message: 'OTP email sent successfully via Gmail SMTP' });
  } catch (error) {
    console.error('[VERCEL SMTP ERROR]:', error);
    return res.status(500).json({ error: 'Failed to dispatch email', details: error.message });
  }
}
