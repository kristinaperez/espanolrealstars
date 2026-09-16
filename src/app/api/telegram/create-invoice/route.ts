import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, STARS_PRICE } from "@/lib/telegram/config";
import { verifySessionToken } from "@/lib/telegram/session";
import { createInvoiceLink } from "@/lib/telegram/bot-api";
import { createPendingPayment, getTelegramUser } from "@/lib/telegram/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = readCookie(cookieHeader, SESSION_COOKIE);
  const telegramId = verifySessionToken(token);
  if (!telegramId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const user = await getTelegramUser(telegramId);
    if (user?.premium) {
      return NextResponse.json({ error: "Already premium" }, { status: 400 });
    }

    const payload = `premium:${telegramId}:${crypto.randomBytes(8).toString("hex")}`;
    const link = await createInvoiceLink({
      title: "Español Real Premium",
      description: "Доступ ко всем 45 урокам, экзаменам, повторению и будущим обновлениям — навсегда.",
      payload,
      amountStars: STARS_PRICE,
    });

    await createPendingPayment({ telegramId, payload, amount: STARS_PRICE, currency: "XTR" });

    return NextResponse.json({ link, payload });
  } catch (error) {
    console.error("[telegram] create-invoice failed", error);
    return NextResponse.json({ error: "Could not create invoice" }, { status: 500 });
  }
}

function readCookie(header: string, name: string): string | null {
  const match = header.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
