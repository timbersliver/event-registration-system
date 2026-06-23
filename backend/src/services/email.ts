import nodemailer from 'nodemailer';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isAvailable: boolean = false;
  private readonly mailpitWebUrl = 'http://localhost:8025';

  constructor() {
    // Use custom SMTP if configured, otherwise default to Mailpit (localhost:1025, no auth)
    if (process.env.EMAIL_HOST) {
      const auth: { user: string; pass: string } | undefined =
        process.env.EMAIL_USER && process.env.EMAIL_PASS
          ? { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
          : undefined;

      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 1025,
        secure: false,
        ...(auth ? { auth } : {}),
      });
      this.isAvailable = true;
    } else {
      // Default: Mailpit on localhost:1025 (no auth needed)
      this.transporter = nodemailer.createTransport({
        host: 'localhost',
        port: 1025,
        secure: false,
      });
      this.isAvailable = true;
    }

    console.log(`[Email] Using SMTP ${process.env.EMAIL_HOST || 'localhost'}:${process.env.EMAIL_PORT || 1025}`);
    console.log(`[Email] Mailpit web UI: ${this.mailpitWebUrl}`);
  }

  private buildHtmlEmail(bodyHtml: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:20px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;">
                    <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                      <tr>
                        <td style="background:rgba(255,255,255,0.2);border-radius:8px;padding:8px 12px;">
                          <span style="color:#fff;font-size:20px;font-weight:bold;">EventHub</span>
                        </td>
                      </tr>
                    </table>
                    <h1 style="color:#fff;margin:16px 0 0;font-size:22px;font-weight:700;">Event Registration System</h1>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="background:#fff;padding:32px;border-radius:0 0 12px 12px;">
                    ${bodyHtml}
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding:16px 32px;text-align:center;">
                    <p style="color:#9ca3af;font-size:12px;margin:0;">
                      Event Registration System &bull; Powered by EventHub
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  private generateIcsContent(event: { name: string; dateTime: string; address: string; handler: string; description?: string }): string {
    const dtStart = new Date(event.dateTime);
    // Default duration: 2 hours
    const dtEnd = new Date(dtStart.getTime() + 2 * 60 * 60 * 1000);

    const formatICSDate = (d: Date): string => {
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const escape = (str: string): string =>
      str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//EventHub//Event Registration System//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${event.name.replace(/[^a-zA-Z0-9]/g, '-')}-${formatICSDate(dtStart)}@event-registration.com`,
      `DTSTART:${formatICSDate(dtStart)}`,
      `DTEND:${formatICSDate(dtEnd)}`,
      `SUMMARY:${escape(event.name)}`,
      `DESCRIPTION:${escape(event.description || '')}`,
      `LOCATION:${escape(event.address)}`,
      `ORGANIZER;CN=${escape(event.handler)}:mailto:noreply@event-registration.com`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
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
        text: `Your verification code is: ${code}. This code will expire in 5 minutes.`,
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
              <p style="color: #666; line-height: 1.6;">This code will expire in 5 minutes.</p>
              <p style="color: #999; font-size: 12px; margin-top: 20px;">If you did not request this code, please ignore this email.</p>
            </div>
          </div>
        `,
      });

      console.log(`[Email] Verification code sent to ${to}`);
      console.log(`[Email] View in Mailpit: ${this.mailpitWebUrl}`);
      return { messageId: info.messageId, previewUrl: this.mailpitWebUrl };
    } catch (err) {
      console.error('[Email] Failed to send email:', err);
      throw new Error('Failed to send verification email');
    }
  }

  async sendConfirmation(
    to: string,
    event: { name: string; dateTime: string; address: string; handler: string; capacity: number },
    registrationCount: number
  ): Promise<{ messageId: string; previewUrl: string | null }> {
    if (!this.isAvailable || !this.transporter) {
      console.log(`[Email] Mock mode: Confirmation sent to ${to} for event "${event.name}"`);
      return { messageId: 'mock', previewUrl: null };
    }

    const date = new Date(event.dateTime);
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true,
    });

    const htmlBody = `
      <div style="text-align:center;margin-bottom:24px;">
        <div style="background:#ecfdf5;width:64px;height:64px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;">
          <span style="font-size:32px;">✅</span>
        </div>
        <h2 style="color:#1f2937;margin:12px 0 4px;">You're registered!</h2>
        <p style="color:#6b7280;margin:0;">Your registration has been confirmed.</p>
      </div>

      <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
        <h3 style="color:#fff;margin:0 0 8px;font-size:20px;">${event.name}</h3>
        <p style="color:#c4b5fd;margin:0;font-size:14px;">${formattedDate} at ${formattedTime}</p>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;">
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="width:32px;vertical-align:top;">
                  <span style="font-size:16px;">📅</span>
                </td>
                <td style="padding-left:12px;">
                  <p style="color:#9ca3af;font-size:12px;margin:0;">Date & Time</p>
                  <p style="color:#1f2937;font-size:14px;font-weight:600;margin:2px 0 0;">${formattedDate} at ${formattedTime}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;">
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="width:32px;vertical-align:top;">
                  <span style="font-size:16px;">📍</span>
                </td>
                <td style="padding-left:12px;">
                  <p style="color:#9ca3af;font-size:12px;margin:0;">Address</p>
                  <p style="color:#1f2937;font-size:14px;font-weight:600;margin:2px 0 0;">${event.address}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;">
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="width:32px;vertical-align:top;">
                  <span style="font-size:16px;">👤</span>
                </td>
                <td style="padding-left:12px;">
                  <p style="color:#9ca3af;font-size:12px;margin:0;">Organizer</p>
                  <p style="color:#1f2937;font-size:14px;font-weight:600;margin:2px 0 0;">${event.handler}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="color:#92400e;font-size:13px;margin:0;line-height:1.5;">
          � <strong>Add to Calendar:</strong> An iCal file (.ics) is attached to this email. Download and open it to add this event to your calendar.
        </p>
      </div>

      <p style="color:#9ca3af;font-size:13px;line-height:1.5;margin:0;text-align:center;">
        Need to make changes? Contact the event organizer directly.
      </p>
    `;

    const icsContent = this.generateIcsContent(event);
    const text = `You're registered for ${event.name}!\n\nEvent Details:\n- Date & Time: ${formattedDate} at ${formattedTime}\n- Address: ${event.address}\n- Organizer: ${event.handler}\n- Capacity: ${registrationCount} / ${event.capacity} registered\n\nAn iCal file (.ics) is attached — open it to add this event to your calendar.`;

    try {
      const info = await this.transporter.sendMail({
        from: '"Event Registration System" <noreply@event-registration.com>',
        to,
        subject: `✅ You're registered for ${event.name}!`,
        text,
        html: this.buildHtmlEmail(htmlBody),
        attachments: [
          {
            filename: `${event.name.replace(/[^a-zA-Z0-9]/g, '_')}.ics`,
            content: icsContent,
            contentType: 'text/calendar; charset=utf-8',
            contentDisposition: 'attachment',
          },
        ],
      });

      console.log(`[Email] Confirmation sent to ${to} for "${event.name}"`);
      console.log(`[Email] View in Mailpit: ${this.mailpitWebUrl}`);
      return { messageId: info.messageId, previewUrl: this.mailpitWebUrl };
    } catch (err) {
      console.error('[Email] Failed to send confirmation:', err);
      // Don't throw — registration already succeeded
      return { messageId: '', previewUrl: null };
    }
  }
}

export const emailService = new EmailService();
