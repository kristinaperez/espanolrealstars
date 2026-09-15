import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Telegram-authenticated users.
 *
 * Login happens either through the Telegram Login Widget (regular website)
 * or automatically inside a Telegram Mini App (WebApp initData). Both flows
 * are verified server-side against TELEGRAM_BOT_TOKEN and converge on this
 * single table, which also tracks Telegram Stars premium unlocks.
 */
export const telegramUsers = pgTable("telegram_users", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull().unique(),
  username: text("username"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  photoUrl: text("photo_url"),
  languageCode: text("language_code"),
  premium: boolean("premium").notNull().default(false),
  premiumSource: text("premium_source"), // "stars" | "license" | null
  premiumAt: timestamp("premium_at", { mode: "string" }),
  authDate: timestamp("auth_date", { mode: "string" }),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});

/**
 * One row per Telegram Stars invoice we generate. Created as "pending" when
 * the invoice link is issued, then flipped to "paid" by the bot webhook once
 * Telegram confirms the `successful_payment` update. This keeps payment
 * confirmation server-side and tamper-proof (never trust the client alone).
 */
export const telegramPayments = pgTable("telegram_payments", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull(),
  payload: text("payload").notNull().unique(),
  currency: text("currency").notNull().default("XTR"),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("pending"), // pending | paid | failed | refunded
  telegramPaymentChargeId: text("telegram_payment_charge_id"),
  providerPaymentChargeId: text("provider_payment_charge_id"),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  paidAt: timestamp("paid_at", { mode: "string" }),
});
