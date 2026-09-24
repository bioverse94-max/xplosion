import nodemailer from "nodemailer";
import prisma from "@/lib/db";
import { APP_CONFIG } from "@/lib/config";
import QRCode from "qrcode";
import { formatCurrency, formatDate } from "@/lib/utils";

interface SendPassAndBillEmailParams {
  registrationId: string;
}

export class EmailService {
  private static transporter: any = null;
  private static lastConfigKey: string = "";

  /**
   * Returns true if SMTP credentials (user and password) are configured in the environment.
   */
  static isConfigured(): boolean {
    const user = (process.env.SMTP_USER || APP_CONFIG.smtp.user || "").trim();
    const pass = (process.env.SMTP_PASS || APP_CONFIG.smtp.pass || "").trim();
    return Boolean(user && pass);
  }

  /**
   * Initializes or returns the Nodemailer SMTP transporter.
   * Cleans passwords (removes spaces from Google App Passwords) and uses fresh env values.
   */
  private static getTransporter(): any {
    const user = (process.env.SMTP_USER || APP_CONFIG.smtp.user || "").trim();
    const rawPass = (process.env.SMTP_PASS || APP_CONFIG.smtp.pass || "").trim();
    const pass = rawPass.replace(/\s+/g, ""); // Google App Passwords are 16 chars without spaces
    const host = (process.env.SMTP_HOST || APP_CONFIG.smtp.host || "smtp.gmail.com").trim();
    const port = parseInt(process.env.SMTP_PORT || String(APP_CONFIG.smtp.port) || "587", 10);
    const secure = port === 465 || process.env.SMTP_SECURE === "true";

    const currentConfigKey = `${user}:${pass.length}:${host}:${port}:${secure}`;

    if (this.transporter && this.lastConfigKey === currentConfigKey) {
      return this.transporter;
    }

    if (user && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: {
            user,
            pass,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });
        this.lastConfigKey = currentConfigKey;
        return this.transporter;
      } catch (err) {
        console.error("[EmailService] Failed to initialize SMTP transporter:", err);
        this.transporter = null;
        return null;
      }
    }

    this.transporter = null;
    return null;
  }

  /**
   * Formats the sender 'From' address for RFC 2822 compliance and Gmail SMTP compatibility.
   */
  private static getFromAddress(): string {
    const user = (process.env.SMTP_USER || APP_CONFIG.smtp.user || "").trim();
    if (user) {
      return `"${APP_CONFIG.appName}" <${user}>`;
    }
    return APP_CONFIG.emailFrom || `"XPLOSION 2K26" <tickets@xplosion2k26.com>`;
  }

  /**
   * Sends an automated email containing confirmed digital passes and transaction receipt.
   * Uses CID attachments for QR codes to guarantee 100% rendering across Gmail, iOS, and Outlook.
   */
  static async sendPassAndBillEmail(params: SendPassAndBillEmailParams): Promise<{
    success: boolean;
    message: string;
  }> {
    const { registrationId } = params;

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        attendee: true,
        items: { include: { ticketType: true } },
        payment: true,
        passes: { include: { event: true } },
        event: true,
      },
    });

    if (!registration) {
      throw new Error(`Registration ${registrationId} not found.`);
    }

    const { attendee, payment, items, passes, event } = registration;
    const recipientEmail = attendee.personalEmail || attendee.email;
    const secondaryEmail =
      attendee.personalEmail && attendee.personalEmail !== attendee.email ? attendee.email : undefined;
    const recipientName = attendee.fullName;

    // Generate QR buffers for CID attachments and fallback data URLs
    const attachments: Array<{ filename: string; content: Buffer; cid: string }> = [];
    const passesWithQr = await Promise.all(
      passes.map(async (pass, index) => {
        let qrDataUrl = "";
        try {
          const qrBuffer = await QRCode.toBuffer(pass.qrToken, {
            width: 280,
            margin: 1,
            color: { dark: "#000000", light: "#ffffff" },
          });

          const cid = `qr_pass_${pass.id}`;
          attachments.push({
            filename: `pass-${pass.passCode}.png`,
            content: qrBuffer,
            cid,
          });

          qrDataUrl = `cid:${cid}`;
        } catch (e) {
          console.error("QR Code generation error:", e);
        }
        return { ...pass, qr: qrDataUrl, index: index + 1 };
      })
    );

    const myPassUrl = `${APP_CONFIG.appUrl}/my-pass?contact=${encodeURIComponent(attendee.phone)}`;

    // Build the responsive, styled HTML email
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Pass & Payment Invoice - ${APP_CONFIG.appName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #050608; color: #e2e8f0; margin: 0; padding: 0; }
    .container { max-width: 620px; margin: 20px auto; background-color: #0d0f15; border: 1px solid #1e2230; border-radius: 20px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #090a0f, #141824); padding: 32px 24px; text-align: center; border-bottom: 2px solid #FF0000; }
    .logo { font-size: 24px; font-weight: 900; letter-spacing: 2px; color: #ffffff; text-transform: uppercase; margin: 0; }
    .logo span { color: #FF0000; }
    .badge { display: inline-block; background: rgba(255, 0, 0, 0.1); border: 1px solid rgba(255, 0, 0, 0.4); color: #FF0000; font-size: 11px; font-weight: bold; padding: 4px 12px; border-radius: 9999px; margin-top: 10px; text-transform: uppercase; letter-spacing: 1px; }
    .content { padding: 32px 24px; }
    .title { font-size: 20px; font-weight: 800; color: #ffffff; margin-top: 0; margin-bottom: 8px; }
    .subtitle { font-size: 14px; color: #94a3b8; margin: 0 0 24px 0; line-height: 1.5; }
    
    /* Pass Card */
    .pass-card { background: #121520; border: 1px solid #23293d; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 28px; box-shadow: 0 0 25px rgba(255, 0, 0, 0.08); }
    .pass-code { font-family: monospace; font-size: 18px; font-weight: bold; color: #FF0000; letter-spacing: 1.5px; background: #08090e; padding: 6px 14px; border-radius: 8px; display: inline-block; border: 1px solid #1e2438; margin-bottom: 16px; }
    .qr-img { width: 180px; height: 180px; border-radius: 12px; border: 2px solid #FF0000; margin: 0 auto 16px auto; display: block; background: #ffffff; padding: 8px; }
    .pass-info { font-size: 13px; color: #cbd5e1; margin: 4px 0; }
    .pass-info strong { color: #ffffff; }

    /* Invoice Table */
    .bill-box { background: #0a0c12; border: 1px solid #1a1e2c; border-radius: 16px; padding: 20px; margin-bottom: 28px; }
    .bill-header { font-size: 14px; font-weight: bold; color: #ffffff; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; border-bottom: 1px solid #1e2334; padding-bottom: 8px; }
    .bill-row { display: flex; justify-content: space-between; font-size: 13px; color: #94a3b8; padding: 6px 0; }
    .bill-row strong { color: #ffffff; }
    .total-row { border-top: 1px solid #23293d; margin-top: 8px; padding-top: 10px; font-size: 16px; font-weight: bold; color: #FF0000; }

    /* Button */
    .btn { display: block; width: fit-content; margin: 20px auto 0 auto; background: #FF0000; color: #000000 !important; text-decoration: none; font-weight: 800; font-size: 14px; padding: 14px 28px; border-radius: 12px; text-transform: uppercase; letter-spacing: 1px; text-align: center; }
    
    .footer { background: #08090e; padding: 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #171b26; line-height: 1.6; }
    .footer a { color: #FF0000; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1 class="logo">XPLOSION <span>2K26</span></h1>
      <div class="badge">Official Pass &amp; Payment Receipt</div>
    </div>

    <!-- Main Content -->
    <div class="content">
      <h2 class="title">You're on the Guestlist, ${recipientName}! &#127881;</h2>
      <p class="subtitle">
        Your payment has been successfully authorized and verified in the database. Below is your official entry pass and itemized transaction receipt.
      </p>

      <!-- Digital Pass Cards -->
      ${passesWithQr
        .map(
          (p) => `
      <div class="pass-card">
        <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
          Cryptographic Admission Pass (${p.index} of ${passesWithQr.length}) &bull; ${p.ticketTypeName}
        </div>
        <div class="pass-code">${p.passCode}</div>
        
        ${p.qr ? `<img src="${p.qr}" alt="Pass QR Code" class="qr-img" />` : ""}

        <div class="pass-info">Pass Holder: <strong>${attendee.fullName}</strong></div>
        <div class="pass-info">Tier: <strong style="color: #FF0000;">${p.ticketTypeName}</strong></div>
        <div class="pass-info">Institution: <strong>${attendee.college}</strong> (${attendee.branch})</div>
        <div class="pass-info">Event: <strong>${event?.title || "XPLOSION 2K26"}</strong></div>
        <div class="pass-info">Venue: <strong>${event?.venueName || "Reborn Club & Kitchen, Outer Ring Road"}, ${event?.city || "Bhubaneswar"}</strong></div>
        <div class="pass-info" style="color: #00df8f; font-weight: bold; margin-top: 8px;">
          &#10003; Validated for Entry at Door Security
        </div>
      </div>
      `
        )
        .join("")}

      <!-- Itemized Transaction Bill -->
      <div class="bill-box">
        <div class="bill-header">Itemized Transaction Bill &amp; Receipt</div>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr style="color: #94a3b8; border-bottom: 1px solid #1a1e2c;">
            <td style="padding: 6px 0;">Order Reference:</td>
            <td style="text-align: right; color: #ffffff; font-family: monospace; font-weight: bold;">${registration.registrationNo}</td>
          </tr>
          <tr style="color: #94a3b8; border-bottom: 1px solid #1a1e2c;">
            <td style="padding: 6px 0;">Payment Method:</td>
            <td style="text-align: right; color: #ffffff;">${payment?.paymentMethod || "UPI / Gateway"}</td>
          </tr>
          <tr style="color: #94a3b8; border-bottom: 1px solid #1a1e2c;">
            <td style="padding: 6px 0;">Transaction ID / UTR:</td>
            <td style="text-align: right; color: #00df8f; font-family: monospace;">${payment?.gatewayPaymentId || "TXN_CONFIRMED"}</td>
          </tr>
          <tr style="color: #94a3b8; border-bottom: 1px solid #1a1e2c;">
            <td style="padding: 6px 0;">Payment Timestamp:</td>
            <td style="text-align: right; color: #ffffff;">${formatDate(payment?.paidAt || new Date())}</td>
          </tr>
          
          <!-- Purchased Items -->
          ${items
            .map(
              (item) => `
          <tr style="color: #cbd5e1; border-bottom: 1px solid #1a1e2c;">
            <td style="padding: 8px 0;">${item.ticketType.name} &times; ${item.quantity}</td>
            <td style="text-align: right; font-weight: bold; color: #ffffff;">${formatCurrency(item.subtotal)}</td>
          </tr>
          `
            )
            .join("")}
          
          <!-- Subtotal & Platform Fee -->
          <tr style="color: #94a3b8;">
            <td style="padding: 6px 0;">Subtotal:</td>
            <td style="text-align: right;">${formatCurrency(registration.subtotal)}</td>
          </tr>
          ${
            registration.platformFee > 0
              ? `
          <tr style="color: #94a3b8;">
            <td style="padding: 6px 0;">Convenience / Platform Fee:</td>
            <td style="text-align: right;">${formatCurrency(registration.platformFee)}</td>
          </tr>`
              : ""
          }
          
          <!-- Total Amount Row -->
          <tr style="border-top: 1px solid #23293d; font-size: 15px;">
            <td style="padding: 12px 0; font-weight: bold; color: #ffffff;">Total Amount Paid:</td>
            <td style="text-align: right; font-weight: 900; color: #FF0000; font-size: 18px;">
              ${formatCurrency(registration.totalAmount)}
            </td>
          </tr>
        </table>
      </div>

      <!-- Action Button -->
      <a href="${myPassUrl}" class="btn">View &amp; Download Pass on Portal</a>
      <p style="text-align: center; font-size: 11px; color: #64748b; margin-top: 10px;">
        Login anytime at <a href="${APP_CONFIG.appUrl}/my-pass" style="color: #FF0000;">${APP_CONFIG.appUrl}/my-pass</a> using your registered phone number (<strong>${attendee.phone}</strong>) or personal email (<strong>${recipientEmail}</strong>).
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 0 0 6px 0;">
        This email serves as an official electronic ticket and commercial receipt for XPLOSION 2K26.
      </p>
      <p style="margin: 0;">
        Please carry your original college student ID card along with this pass for entrance scanning. Non-transferable.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    const transporter = this.getTransporter();

    if (transporter && APP_CONFIG.notificationProvider !== "MOCK") {
      try {
        await transporter.sendMail({
          from: this.getFromAddress(),
          to: recipientEmail,
          cc: secondaryEmail,
          subject: `🎟️ Entry Pass & Payment Receipt: ${registration.registrationNo} - ${APP_CONFIG.appName}`,
          html: htmlContent,
          attachments,
        });

        console.log(`[EmailService] ✓ Pass & receipt successfully sent to ${recipientEmail}`);

        await prisma.notificationLog.create({
          data: {
            recipient: recipientEmail,
            channel: "EMAIL",
            template: "PASS_CONFIRMATION_AND_BILL",
            status: "SENT",
            payloadJson: JSON.stringify({
              registrationNo: registration.registrationNo,
              attendeePhone: attendee.phone,
              amount: registration.totalAmount,
              passesCount: passes.length,
            }),
          },
        });

        return { success: true, message: `Email delivered to ${recipientEmail}` };
      } catch (sendErr) {
        console.error("[EmailService] ✕ Error dispatching SMTP email:", sendErr);
        await prisma.notificationLog.create({
          data: {
            recipient: recipientEmail,
            channel: "EMAIL",
            template: "PASS_CONFIRMATION_AND_BILL",
            status: "FAILED",
            payloadJson: JSON.stringify({
              error: sendErr instanceof Error ? sendErr.message : "SMTP Send Error",
            }),
          },
        });
      }
    } else {
      console.log(`[EmailService MOCK] SMTP not configured in .env. Automated Pass simulated for ${recipientEmail}:`);
      console.log(` -> Registration: ${registration.registrationNo}`);
      console.log(` -> Total Amount: ${formatCurrency(registration.totalAmount)}`);
      console.log(` -> Pass Code: ${passes[0]?.passCode || "N/A"}`);
      console.log(` -> Phone Login: ${attendee.phone}`);

      await prisma.notificationLog.create({
        data: {
          recipient: recipientEmail,
          channel: "EMAIL",
          template: "PASS_CONFIRMATION_AND_BILL",
          status: "SENT",
          payloadJson: JSON.stringify({
            mode: "MOCK_DEVELOPMENT",
            registrationNo: registration.registrationNo,
            attendeePhone: attendee.phone,
            amount: registration.totalAmount,
            passesCount: passes.length,
          }),
        },
      });
    }

    return {
      success: true,
      message: `Pass & Transaction Bill prepared for ${recipientEmail}${secondaryEmail ? ` (CC: ${secondaryEmail})` : ""}`,
    };
  }

  /**
   * Dispatches a 6-digit OTP verification code to an attendee's personal email.
   * Logs attempt to database and provides actionable error feedback if SMTP fails.
   */
  static async sendOtpEmail(params: { to: string; otp: string }): Promise<{
    success: boolean;
    delivered: boolean;
    error?: string;
  }> {
    const { to, otp } = params;
    const transporter = this.getTransporter();

    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #030303; color: #f5f5f5; padding: 24px; margin: 0;">
  <div style="max-width: 480px; margin: 0 auto; background-color: #080808; border: 1px solid #ff0000; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(255,0,0,0.2);">
    <div style="background-color: #0d0d0d; padding: 20px; text-align: center; border-bottom: 1px solid #222;">
      <h2 style="color: #ff0000; font-family: monospace; font-size: 20px; margin: 0; letter-spacing: 2px;">XPLOSION 2K26</h2>
      <p style="color: #888; font-size: 11px; margin: 4px 0 0 0; text-transform: uppercase;">IDENTITY &amp; EMAIL VERIFICATION</p>
    </div>
    <div style="padding: 28px; text-align: center;">
      <p style="color: #ccc; font-size: 13px; margin: 0 0 16px 0;">Use the 6-digit verification code below to confirm your personal email address:</p>
      <div style="font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #ffffff; background-color: #121212; padding: 14px 20px; border-radius: 12px; display: inline-block; border: 1px dashed #ff0000; margin: 8px 0 20px 0;">
        ${otp}
      </div>
      <p style="color: #777; font-size: 11px; margin: 0; line-height: 1.5;">This code is valid for 10 minutes. If you did not request this verification, please ignore this email.</p>
    </div>
  </div>
</body>
</html>`;

    if (transporter && APP_CONFIG.notificationProvider !== "MOCK") {
      try {
        await transporter.sendMail({
          from: this.getFromAddress(),
          to,
          subject: `${otp} is your XPLOSION 2K26 Email Verification Code`,
          html,
        });

        console.log(`[EmailService] ✓ Live OTP email successfully delivered to ${to} via SMTP`);

        await prisma.notificationLog.create({
          data: {
            recipient: to,
            channel: "EMAIL",
            template: "OTP_VERIFICATION",
            status: "SENT",
            payloadJson: JSON.stringify({ otpSent: true }),
          },
        });

        return { success: true, delivered: true };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "SMTP Send Error";
        console.error("[EmailService] ✕ Failed to send OTP email via SMTP:", err);

        await prisma.notificationLog.create({
          data: {
            recipient: to,
            channel: "EMAIL",
            template: "OTP_VERIFICATION",
            status: "FAILED",
            payloadJson: JSON.stringify({ error: errorMsg }),
          },
        });

        return { success: false, delivered: false, error: errorMsg };
      }
    } else {
      console.log(`[EmailService MOCK] Live email paused (SMTP_USER/PASS not configured in .env). Simulated OTP for ${to}: [${otp}]`);

      await prisma.notificationLog.create({
        data: {
          recipient: to,
          channel: "EMAIL",
          template: "OTP_VERIFICATION",
          status: "SENT",
          payloadJson: JSON.stringify({ mode: "MOCK_DEVELOPMENT" }),
        },
      });

      return { success: true, delivered: false };
    }
  }
}
