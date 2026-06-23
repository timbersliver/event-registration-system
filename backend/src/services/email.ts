import nodemailer from 'nodemailer';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isAvailable: boolean = false;

  constructor() {
    // Use Ethereal for development if no real SMTP configured
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      this.isAvailable = true;
    } else {
      // Create Ethereal test account automatically
      this.initializeEthereal();
    }
  }

  private async initializeEthereal(): Promise<void> {
    try {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      this.isAvailable = true;
      console.log('[Email] Using Ethereal test account:', testAccount.user);
    } catch (err) {
      console.warn('[Email] Failed to create Ethereal account. Email disabled.');
      this.isAvailable = false;
    }
  }

  async sendVerificationCode(to: string, code: string): Promise<{ messageId: string; previewUrl: string | null }> {
    if (!this.isAvailable || !this.transporter) {
      console.log(`[Email] Mock mode: Verification code ${code} sent to ${to}`);
      return { messageId: 'mock', previewUrl: null };
    }

    try {
      const info = await this.transporter.sendMail({
        from: '"Event Registration System" <noreply@event-registration.com>',
        to,
        subject: 'Your Event Registration Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: #4f46e5; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Event Registration</h1>
            </div>
            <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-top: 0;">Verification Code</h2>
              <p style="color: #666; line-height: 1.6;">Please use the following 6-digit code to complete your event registration:</p>
              <div style="text-align: center; margin: 30px 0;">
                <div style="display: inline-block; background-color: #f3f4f6; padding: 15px 30px; border-radius: 8px; letter-spacing: 8px; font-size: 32px; font-weight: bold; color: #4f46e5;">
                  ${code}
                </div>
              </div>
              <p style="color: #666; line-height: 1.6;">This code will expire in 10 minutes.</p>
              <p style="color: #999; font-size: 12px; margin-top: 20px;">If you did not request this code, please ignore this email.</p>
            </div>
          </div>
        `,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info) || null;
      console.log(`[Email] Verification code sent to ${to}, preview: ${previewUrl}`);
      return { messageId: info.messageId, previewUrl };
    } catch (err) {
      console.error('[Email] Failed to send email:', err);
      throw new Error('Failed to send verification email');
    }
  }
}

export const emailService = new EmailService();
