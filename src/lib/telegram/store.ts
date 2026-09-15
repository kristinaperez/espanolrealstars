import { eq } from "drizzle-orm";
import { db } from "@/db";
import { telegramPayments, telegramUsers } from "@/db/schema";
import type { VerifiedTelegramIdentity } from "./verify";
import type { TelegramUser } from "./types";

function toPublicUser(row: typeof telegramUsers.$inferSelect): TelegramUser {
  return {
    telegramId: row.telegramId,
    username: row.username,
    firstName: row.firstName,
    lastName: row.lastName,
    photoUrl: row.photoUrl,
    languageCode: row.languageCode,
    premium: row.premium,
    premiumSource: (row.premiumSource as TelegramUser["premiumSource"]) ?? null,
  };
}

export async function upsertTelegramUser(identity: VerifiedTelegramIdentity): Promise<TelegramUser> {
  const existing = await db
    .select()
    .from(telegramUsers)
    .where(eq(telegramUsers.telegramId, identity.telegramId))
    .limit(1);

  const authDateIso = new Date(identity.authDate * 1000).toISOString();

  if (existing.length === 0) {
    const [row] = await db
      .insert(telegramUsers)
      .values({
        telegramId: identity.telegramId,
        username: identity.username,
        firstName: identity.firstName,
        lastName: identity.lastName,
        photoUrl: identity.photoUrl,
        languageCode: identity.languageCode,
        authDate: authDateIso,
      })
      .returning();
    return toPublicUser(row);
  }

  const [row] = await db
    .update(telegramUsers)
    .set({
      username: identity.username,
      firstName: identity.firstName,
      lastName: identity.lastName,
      photoUrl: identity.photoUrl,
      languageCode: identity.languageCode,
      authDate: authDateIso,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(telegramUsers.telegramId, identity.telegramId))
    .returning();
  return toPublicUser(row);
}

export async function getTelegramUser(telegramId: string): Promise<TelegramUser | null> {
  const rows = await db.select().from(telegramUsers).where(eq(telegramUsers.telegramId, telegramId)).limit(1);
  return rows[0] ? toPublicUser(rows[0]) : null;
}

export async function grantPremium(
  telegramId: string,
  source: "stars" | "license",
): Promise<TelegramUser | null> {
  const rows = await db
    .update(telegramUsers)
    .set({ premium: true, premiumSource: source, premiumAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    .where(eq(telegramUsers.telegramId, telegramId))
    .returning();
  return rows[0] ? toPublicUser(rows[0]) : null;
}

export async function createPendingPayment(params: {
  telegramId: string;
  payload: string;
  amount: number;
  currency: string;
}) {
  await db.insert(telegramPayments).values({
    telegramId: params.telegramId,
    payload: params.payload,
    amount: params.amount,
    currency: params.currency,
    status: "pending",
  });
}

export async function markPaymentPaid(params: {
  payload: string;
  telegramPaymentChargeId: string;
  providerPaymentChargeId?: string;
}): Promise<string | null> {
  const rows = await db
    .update(telegramPayments)
    .set({
      status: "paid",
      telegramPaymentChargeId: params.telegramPaymentChargeId,
      providerPaymentChargeId: params.providerPaymentChargeId,
      paidAt: new Date().toISOString(),
    })
    .where(eq(telegramPayments.payload, params.payload))
    .returning({ telegramId: telegramPayments.telegramId });
  return rows[0]?.telegramId ?? null;
}

export async function getLatestPaymentStatus(telegramId: string) {
  const rows = await db
    .select()
    .from(telegramPayments)
    .where(eq(telegramPayments.telegramId, telegramId))
    .orderBy(telegramPayments.id);
  return rows[rows.length - 1] ?? null;
}
