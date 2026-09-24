import dotenv from "dotenv";
dotenv.config();

export const APP_CONFIG = {
  appName: "NEON GENESIS 2026",
  port: parseInt(process.env.PORT || "5000", 10),
  frontendUrl: process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || process.env.FRONTEND_URL || "http://localhost:3000",
  databaseUrl: process.env.DATABASE_URL || "",
  directUrl: process.env.DIRECT_URL || "",
  hmacSecret: process.env.HMAC_SECRET || "dev-secret-super-secure-hmac-key-change-in-production-min-32-chars",
  authSecret: process.env.AUTH_SECRET || "dev-secret-admin-session-secret-change-in-production-min-32-chars",
  autoApprovePayments: process.env.AUTO_APPROVE_PAYMENTS !== "false",
  reservationHoldMinutes: 10,
  notificationProvider: process.env.NOTIFICATION_PROVIDER || "SMTP",
  emailFrom: process.env.EMAIL_FROM || "Neon Genesis 2026 Ticketing <tickets@neongenesis2026.com>",
  smtp: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
};
