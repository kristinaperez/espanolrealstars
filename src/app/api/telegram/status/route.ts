import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/telegram/config";
import { verifySessionToken } from "@/lib/telegram/session";
import { getLatestPaymentStatus, getTelegramUser } from "@/lib/telegram/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = readCookie(cookieHeader, SESSION_COOKIE);
  const telegramId = verifySessionToken(token);
  if (!telegramId) return NextResponse.json({ user: null, payment: null });

  try {
    const [user, payment] = await Promise.all([
      getTelegramUser(telegramId),
      getLatestPaymentStatus(telegramId),
    ]);
    return NextResponse.json({
      user,
      payment: payment
        ? { payload: payment.payload, status: payment.status, amount: payment.amount, currency: payment.currency }
        : null,
    });
  } catch (error) {
    console.error("[telegram] status failed", error);
    return NextResponse.json({ user: null, payment: null });
  }
}

function readCookie(header: string, name: string): string | null {
  const match = header.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
