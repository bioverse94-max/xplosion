export const APP_CONFIG = {
  appName: "XPLOSION 2K26",
  appDescription: "The Ultimate College Afterparty",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  databaseUrl: process.env.DATABASE_URL || "file:./dev.db",
  hmacSecret: process.env.HMAC_SECRET || "dev-secret-super-secure-hmac-key-change-in-production-min-32-chars",
  authSecret: process.env.AUTH_SECRET || "dev-secret-admin-session-secret-change-in-production-min-32-chars",
  paymentProvider: (process.env.PAYMENT_PROVIDER || "MOCK") as "MOCK" | "RAZORPAY" | "STRIPE",
  paymentKeyId: process.env.PAYMENT_KEY_ID || "rzp_test_placeholder_key",
  paymentKeySecret: process.env.PAYMENT_KEY_SECRET || "rzp_test_placeholder_secret",
  paymentWebhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || "whsec_placeholder_secret",
  reservationHoldMinutes: 10,
  taxRatePercent: 0, // In percent, if applicable
  platformFeeINR: 0, // Flat platform fee per order in INR
  // UPI / QR Payment Settings
  upiPayeeVpa: process.env.NEXT_PUBLIC_UPI_VPA || "xplosion2k26@sbi",
  upiPayeeName: process.env.NEXT_PUBLIC_UPI_NAME || "XPLOSION 2K26",
  upiMerchantCode: process.env.NEXT_PUBLIC_UPI_MC || "",
  autoApprovePayments: process.env.AUTO_APPROVE_PAYMENTS === "true", // Default false for strict manual gate checker/admin verification
  // Backend & Deployment URLs
  backendUrl: process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  // Automated Email Configuration
  notificationProvider: process.env.NOTIFICATION_PROVIDER || "SMTP",
  emailFrom: process.env.EMAIL_FROM || "XPLOSION 2K26 <tickets@xplosion2k26.com>",
  smtp: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
};
