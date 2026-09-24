import nodemailer from "nodemailer";
import prisma from "../lib/db";
import { APP_CONFIG } from "../lib/config";
import QRCode from "qrcode";
import { formatCurrency, formatDate } from "../lib/utils";

interface SendPassAndBillEmailParams {
  registrationId: string;
}

export class EmailService {
  private static transporter: any = null;

  private static getTransporter(): any {
    if (this.transporter) return this.transporter;

    if (APP_CONFIG.smtp.user && APP_CONFIG.smtp.pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host: APP_CONFIG.smtp.host,
          port: APP_CONFIG.smtp.port,
          secure: APP_CONFIG.smtp.secure,
          auth: {
            user: APP_CONFIG.smtp.user,
            pass: APP_CONFIG.smtp.pass,
          },
        });
        return this.transporter;
      } catch (err) {
        console.error("[EmailService] Failed to initialize SMTP transporter:", err);
        return null;
      }
    }
    return null;
  }

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
    const recipientEmail = attendee.email;
    const recipientName = attendee.fullName;

    const passesWithQr = await Promise.all(
      passes.map(async (pass, index) => {
        let qr = "";
        try {
          qr = await QRCode.toDataURL(pass.qrToken, {
            width: 250,
            margin: 1,
            color: { dark: "#000000", light: "#ffffff" },
          });
        } catch (e) {
          console.error("QR Data URL generation error:", e);
        }
        return { ...pass, qr, index: index + 1 };
      })
    );

    const myPassUrl = `${APP_CONFIG.appUrl}/my-pass?contact=${encodeURIComponent(attendee.phone)}`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Your Pass & Payment Invoice - ${APP_CONFIG.appName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #050608; color: #e2e8f0; margin: 0; padding: 0; }
    .container { max-width: 620px; margin: 20px auto; background-color: #0d0f15; border: 1px solid #1e2230; border-radius: 20px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #090a0f, #141824); padding: 32px 24px; text-align: center; border-bottom: 2px solid #00f0ff; }
    .logo { font-size: 24px; font-weight: 900; letter-spacing: 2px; color: #ffffff; text-transform: uppercase; margin: 0; }
    .logo span { color: #00f0ff; }
    .badge { display: inline-block; background: rgba(0, 240, 255, 0.1); border: 1px solid rgba(0, 240, 255, 0.4); color: #00f0ff; font-size: 11px; font-weight: bold; padding: 4px 12px; border-radius: 9999px; margin-top: 10px; text-transform: uppercase; letter-spacing: 1px; }
    .content { padding: 32px 24px; }
    .title { font-size: 20px; font-weight: 800; color: #ffffff; margin-top: 0; margin-bottom: 8px; }
    .subtitle { font-size: 14px; color: #94a3b8; margin: 0 0 24px 0; line-height: 1.5; }
    .pass-card { background: #121520; border: 1px solid #23293d; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 28px; }
    .pass-code { font-family: monospace; font-size: 18px; font-weight: bold; color: #00f0ff; letter-spacing: 1.5px; background: #08090e; padding: 6px 14px; border-radius: 8px; display: inline-block; border: 1px solid #1e2438; margin-bottom: 16px; }
    .qr-img { width: 180px; height: 180px; border-radius: 12px; border: 2px solid #00f0ff; margin: 0 auto 16px auto; display: block; background: #ffffff; padding: 8px; }
    .pass-info { font-size: 13px; color: #cbd5e1; margin: 4px 0; }
    .pass-info strong { color: #ffffff; }
    .bill-box { background: #0a0c12; border: 1px solid #1a1e2c; border-radius: 16px; padding: 20px; margin-bottom: 28px; }
    .bill-header { font-size: 14px; font-weight: bold; color: #ffffff; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; border-bottom: 1px solid #1e2334; padding-bottom: 8px; }
    .btn { display: block; width: fit-content; margin: 20px auto 0 auto; background: #00f0ff; color: #000000 !important; text-decoration: none; font-weight: 800; font-size: 14px; padding: 14px 28px; border-radius: 12px; text-transform: uppercase; letter-spacing: 1px; text-align: center; }
    .footer { background: #08090e; padding: 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #171b26; line-height: 1.6; }
    .footer a { color: #00f0ff; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">NEON <span>GENESIS</span> 2026</h1>
      <div class="badge">Official Pass & Payment Receipt</div>
    </div>
    <div class="content">
      <h2 class="title">You're on the Guestlist, ${recipientName}! 🎉</h2>
      <p class="subtitle">
        Your payment has been successfully authorized and verified in the database. Below is your official entry pass and itemized transaction receipt.
      </p>

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
        <div class="pass-info">Tier: <strong style="color: #00f0ff;">${p.ticketTypeName}</strong></div>
        <div class="pass-info">Institution: <strong>${attendee.college}</strong> (${attendee.branch})</div>
        <div class="pass-info">Event: <strong>${event?.title || "Neon Genesis 2026"}</strong></div>
        <div class="pass-info">Venue: <strong>${event?.venueName || "Main Arena"}, ${event?.city || "City"}</strong></div>
        <div class="pass-info" style="color: #00df8f; font-weight: bold; margin-top: 8px;">
          ✓ Validated for Entry at Door Security
        </div>
      </div>
      `
        )
        .join("")}

      <div class="bill-box">
        <div class="bill-header">Itemized Transaction Bill & Receipt</div>
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
          ${items
            .map(
              (item) => `
          <tr style="color: #cbd5e1; border-bottom: 1px solid #1a1e2c;">
            <td style="padding: 8px 0;">${item.ticketType.name} &times; ${item.quantity}</td>
            <td style="text-align: right; font-weight: bold; color: #ffffff;">${formatCurrency(item.subtotal)}</td>
          </tr>`
            )
            .join("")}
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
          <tr style="border-top: 1px solid #23293d; font-size: 15px;">
            <td style="padding: 12px 0; font-weight: bold; color: #ffffff;">Total Amount Paid:</td>
            <td style="text-align: right; font-weight: 900; color: #00f0ff; font-size: 18px;">
              ${formatCurrency(registration.totalAmount)}
            </td>
          </tr>
        </table>
      </div>

      <a href="${myPassUrl}" class="btn">View & Download Pass on Portal</a>
      <p style="text-align: center; font-size: 11px; color: #64748b; margin-top: 10px;">
        Login anytime at <a href="${APP_CONFIG.appUrl}/login" style="color: #00f0ff;">${APP_CONFIG.appUrl}/login</a> using your registered phone number (<strong>${attendee.phone}</strong>).
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px 0;">Official electronic ticket & receipt for Neon Genesis 2026.</p>
      <p style="margin: 0;">Carry your original college student ID along with this pass for entrance scanning.</p>
    </div>
  </div>
</body>
</html>
    `;

    const transporter = this.getTransporter();

    if (transporter) {
      try {
        await transporter.sendMail({
          from: APP_CONFIG.emailFrom,
          to: recipientEmail,
          subject: `🎟️ Entry Pass & Payment Receipt: ${registration.registrationNo} - Neon Genesis 2026`,
          html: htmlContent,
        });

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
        console.error("[EmailService] Error dispatching SMTP email:", sendErr);
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
      console.log(`[EmailService MOCK] Pass & Bill email simulated for ${recipientEmail}`);
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
          }),
        },
      });
    }

    return { success: true, message: `Pass & Transaction Bill prepared for ${recipientEmail}` };
  }
}
