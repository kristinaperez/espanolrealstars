export const STARS_PRICE = 500;
export const STARS_CURRENCY = "XTR";
export const SESSION_COOKIE = "er_tg_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export function botToken(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN || null;
}

export function botUsername(): string | null {
  return process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || null;
}

export function authSecret(): string {
  // Falls back to the bot token so a working deployment doesn't need a
  // second secret, but a dedicated AUTH_SECRET is recommended in production.
  return process.env.AUTH_SECRET || botToken() || "espanol-real-dev-secret";
}

export function webhookSecret(): string | null {
  return process.env.TELEGRAM_WEBHOOK_SECRET || null;
}

/** Telegram integration is fully optional — the rest of the app must work without it. */
export function telegramEnabled(): boolean {
  return Boolean(botToken() && botUsername());
}
