import { NextResponse } from "next/server";
import { webhookSecret } from "@/lib/telegram/config";
import { answerPreCheckoutQuery } from "@/lib/telegram/bot-api";
import { grantPremium, markPaymentPaid } from "@/lib/telegram/store";

export const dynamic = "force-dynamic";

interface TelegramUpdate {
  pre_checkout_query?: {
    id: string;
    from: { id: number };
    invoice_payload: string;
  };
  message?: {
    from?: { id: number };
    successful_payment?: {
      invoice_payload: string;
      telegram_payment_charge_id: string;
      provider_payment_charge_id?: string;
      total_amount: number;
      currency: string;
    };
  };
}

/**
 * Telegram bot webhook.
 *
 * Register with: `POST /setWebhook` pointing here, ideally with a
 * `secret_token` so we can verify the `X-Telegram-Bot-Api-Secret-Token`
 * header (see scripts/setup-telegram-webhook.mjs).
 */
export async function POST(request: Request) {
  const expectedSecret = webhookSecret();
  if (expectedSecret) {
    const provided = request.headers.get("x-telegram-bot-api-secret-token");
    if (provided !== expectedSecret) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    // Telegram requires an answer within ~10s or the payment sheet fails.
    if (update.pre_checkout_query) {
      await answerPreCheckoutQuery(update.pre_checkout_query.id, true);
    }

    const payment = update.message?.successful_payment;
    if (payment) {
      const telegramId = await markPaymentPaid({
        payload: payment.invoice_payload,
        telegramPaymentChargeId: payment.telegram_payment_charge_id,
        providerPaymentChargeId: payment.provider_payment_charge_id,
      });
      if (telegramId) {
        await grantPremium(telegramId, "stars");
      }
    }
  } catch (error) {
    console.error("[telegram] webhook processing failed", error);
    // Still return 200 so Telegram doesn't hammer retries for a logged bug.
  }

  return NextResponse.json({ ok: true });
}
