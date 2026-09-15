import { NextResponse } from "next/server";
import { botUsername, STARS_PRICE, telegramEnabled } from "@/lib/telegram/config";

export const dynamic = "force-dynamic";

/** Lets the client feature-detect Telegram integration without hardcoding secrets. */
export async function GET() {
  return NextResponse.json({
    enabled: telegramEnabled(),
    botUsername: botUsername(),
    starsPrice: STARS_PRICE,
  });
}
