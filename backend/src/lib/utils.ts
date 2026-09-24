export function formatCurrency(amount: number, currency: string = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

import crypto from "crypto";

export function generateRegistrationNo(): string {
  const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
  const timeSuffix = Date.now().toString(36).slice(-3).toUpperCase();
  return `FRS26-${timeSuffix}${randomHex}`;
}

export function generatePassCode(): string {
  const randomHex = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `PASS-FRS26-${randomHex}`;
}
