import { NextResponse } from "next/server";
import { getTelegramUser } from "@/lib/telegram/store";
import { verifySessionToken } from "@/lib/telegram/session";
import { SESSION_COOKIE } from "@/lib/telegram/config";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = readCookie(cookieHeader, SESSION_COOKIE);
  const telegramId = verifySessionToken(token);
  if (!telegramId) return NextResponse.json({ user: null });

  try {
    const user = await getTelegramUser(telegramId);
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}

function readCookie(header: string, name: string): string | null {
  const match = header.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
