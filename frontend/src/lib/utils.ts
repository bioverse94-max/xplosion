import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStringOrDate: string | Date): string {
  const date = typeof dateStringOrDate === "string" ? new Date(dateStringOrDate) : dateStringOrDate;
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatTime(dateStringOrDate: string | Date): string {
  const date = typeof dateStringOrDate === "string" ? new Date(dateStringOrDate) : dateStringOrDate;
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
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
