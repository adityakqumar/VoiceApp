const nodemailer = require('nodemailer');

// Create transporter based on environment variables
function createTransporter() {
  const emailService = process.env.EMAIL_SERVICE || 'gmail';
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    console.log('⚠️  EMAIL_USER / EMAIL_PASS not set — OTPs will only print to console');
    return null;
  }

  if (emailService === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass, // Use a Gmail App Password, NOT your regular password
      },
    });
  }

  // Generic SMTP (SendGrid, Mailgun, etc.)
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
}

const transporter = createTransporter();

async function sendOtpEmail(toEmail, otpCode) {
  // Always log to console (for dev visibility)
  console.log(`\n🔑 OTP for ${toEmail}: ${otpCode}\n`);

  if (!transporter) {
    console.log('📧 Email not configured — OTP printed above only');
    return { sent: false, reason: 'no-config' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"VoiceApp" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Your VoiceApp Verification Code',
      text: `Your verification code is: ${otpCode}\n\nThis code expires in 5 minutes.\n\nIf you didn't request this, ignore this email.`,
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 30px; background: #0a0e1a; border-radius: 16px; color: #e2e8f0;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(135deg, #3b82f6, #06b6d4); line-height: 56px; font-size: 28px; text-align: center;">📞</div>
            <h1 style="font-size: 24px; font-weight: 800; margin: 16px 0 0; background: linear-gradient(135deg, #3b82f6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">VoiceApp</h1>
          </div>
          <p style="color: #94a3b8; font-size: 15px; text-align: center; margin-bottom: 24px;">Enter this code to verify your email</p>
          <div style="text-align: center; padding: 20px; background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 12px; margin-bottom: 24px;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #3b82f6; font-family: monospace;">${otpCode}</span>
          </div>
          <p style="color: #64748b; font-size: 13px; text-align: center;">This code expires in 5 minutes.</p>
          <p style="color: #475569; font-size: 12px; text-align: center; margin-top: 32px; border-top: 1px solid rgba(30, 58, 95, 0.3); padding-top: 16px;">
            If you didn't request this code, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    console.log(`📧 OTP email sent to ${toEmail} (Message ID: ${info.messageId})`);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send OTP email to ${toEmail}:`, error.message);
    // Don't throw — fall back to console-only
    return { sent: false, reason: error.message };
  }
}

module.exports = { sendOtpEmail };
