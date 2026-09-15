import crypto from "node:crypto";
import { authSecret, SESSION_MAX_AGE_SECONDS } from "./config";

/**
 * Minimal, dependency-free signed session token: `telegramId.expiry.signature`.
 * Good enough for an httpOnly cookie holding a public Telegram user id — the
 * signature just proves *we* issued it, nothing sensitive is stored inside.
 */
export function createSessionToken(telegramId: string): string {
  const expires = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const payload = `${telegramId}.${expires}`;
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [telegramId, expiresRaw, signature] = parts;
  const payload = `${telegramId}.${expiresRaw}`;
  const expected = sign(payload);
  if (!timingSafeEqual(expected, signature)) return null;
  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || Date.now() / 1000 > expires) return null;
  return telegramId;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", authSecret()).update(payload).digest("hex");
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
