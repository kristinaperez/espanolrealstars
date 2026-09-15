import { NextResponse } from "next/server";
import { botToken, SESSION_MAX_AGE_SECONDS, SESSION_COOKIE } from "@/lib/telegram/config";
import { verifyLoginWidget, type LoginWidgetPayload } from "@/lib/telegram/verify";
import { createSessionToken } from "@/lib/telegram/session";
import { upsertTelegramUser } from "@/lib/telegram/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const token = botToken();
  if (!token) {
    return NextResponse.json({ error: "Telegram login is not configured" }, { status: 501 });
  }

  let body: LoginWidgetPayload;
  try {
    body = (await request.json()) as LoginWidgetPayload;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const identity = verifyLoginWidget(body, token);
  if (!identity) {
    return NextResponse.json({ error: "Signature verification failed" }, { status: 401 });
  }

  try {
    const user = await upsertTelegramUser(identity);
    const response = NextResponse.json({ user });
    response.cookies.set(SESSION_COOKIE, createSessionToken(identity.telegramId), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return response;
  } catch (error) {
    console.error("[telegram] login-widget failed", error);
    return NextResponse.json({ error: "Could not save user" }, { status: 500 });
  }
}
