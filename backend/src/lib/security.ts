import crypto from "crypto";
import { APP_CONFIG } from "./config";

/**
 * Generates an opaque, cryptographically tamper-proof token for QR codes.
 * Unified compact format: v1.<encodedPayload>.<hmacSignature>
 */
export function generateQrToken(passId: string, eventId: string): string {
  const timestamp = Date.now().toString();
  const payload = `${passId}:${eventId}:${timestamp}`;
  const hmac = crypto.createHmac("sha256", APP_CONFIG.hmacSecret);
  hmac.update(payload);
  const signature = hmac.digest("hex");
  const encodedPayload = Buffer.from(payload, "utf-8").toString("base64url");
  return `v1.${encodedPayload}.${signature}`;
}

export const generateQrVerificationToken = generateQrToken;

/**
 * Validates whether an incoming QR token has a valid signature.
 * Supports both unified 3-part and legacy 4-part token formats.
 */
export function verifyQrToken(token: string, eventId: string): { isValid: boolean; passId?: string } {
  try {
    if (!token || !token.startsWith("v1.")) {
      return { isValid: false };
    }

    const parts = token.split(".");

    // Unified 3-part format: v1.<encodedPayload>.<signature>
    if (parts.length === 3) {
      const [, encodedPayload, providedSignature] = parts;
      const payload = Buffer.from(encodedPayload, "base64url").toString("utf-8");
      const [passId, tokenEventId] = payload.split(":");

      if (tokenEventId !== eventId) {
        return { isValid: false };
      }

      const hmac = crypto.createHmac("sha256", APP_CONFIG.hmacSecret);
      hmac.update(payload);
      const expectedSignature = hmac.digest("hex");

      let matches = false;
      if (providedSignature.length === expectedSignature.length) {
        matches = crypto.timingSafeEqual(
          Buffer.from(providedSignature, "utf-8"),
          Buffer.from(expectedSignature, "utf-8")
        );
      } else if (providedSignature.length === 32) {
        matches = crypto.timingSafeEqual(
          Buffer.from(providedSignature, "utf-8"),
          Buffer.from(expectedSignature.slice(0, 32), "utf-8")
        );
      }

      return { isValid: matches, passId: matches ? passId : undefined };
    }

    // Legacy 4-part format: v1.<passId>.<timestamp>.<signature>
    if (parts.length === 4) {
      const [, passId, timestamp, receivedSignature] = parts;
      const payload = `${passId}:${eventId}:${timestamp}`;
      const expectedSignature = crypto
        .createHmac("sha256", APP_CONFIG.hmacSecret)
        .update(payload)
        .digest("hex");

      if (receivedSignature.length !== expectedSignature.length) {
        return { isValid: false };
      }

      const isValid = crypto.timingSafeEqual(
        Buffer.from(receivedSignature, "utf-8"),
        Buffer.from(expectedSignature, "utf-8")
      );

      return { isValid, passId: isValid ? passId : undefined };
    }

    return { isValid: false };
  } catch {
    return { isValid: false };
  }
}

/**
 * Cryptographically signs an admin session payload using HMAC-SHA256.
 */
export function signSession(payload: any, secret = APP_CONFIG.authSecret): string {
  const rawPayload = JSON.stringify({
    ...payload,
    _signedAt: Date.now(),
  });
  const encodedData = Buffer.from(rawPayload, "utf-8").toString("base64url");
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(encodedData);
  const signature = hmac.digest("hex");
  return `${encodedData}.${signature}`;
}

/**
 * Verifies and decodes a signed admin session token.
 */
export function verifySession<T = any>(token: string, secret = APP_CONFIG.authSecret): T | null {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [encodedData, signature] = parts;
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(encodedData);
    const expected = hmac.digest("hex");

    if (signature.length !== expected.length) return null;

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, "utf-8"),
      Buffer.from(expected, "utf-8")
    );

    if (!isValid) return null;

    const jsonStr = Buffer.from(encodedData, "base64url").toString("utf-8");
    return JSON.parse(jsonStr) as T;
  } catch {
    return null;
  }
}
