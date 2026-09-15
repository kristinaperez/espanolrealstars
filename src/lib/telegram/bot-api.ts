import { botToken, STARS_CURRENCY } from "./config";

const API_ROOT = "https://api.telegram.org";

async function callTelegram<T>(method: string, body: Record<string, unknown>): Promise<T> {
  const token = botToken();
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  const response = await fetch(`${API_ROOT}/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await response.json()) as { ok: boolean; result?: T; description?: string };
  if (!json.ok) {
    throw new Error(json.description || `Telegram API error calling ${method}`);
  }
  return json.result as T;
}

export async function createInvoiceLink(params: {
  title: string;
  description: string;
  payload: string;
  amountStars: number;
}): Promise<string> {
  return callTelegram<string>("createInvoiceLink", {
    title: params.title,
    description: params.description,
    payload: params.payload,
    currency: STARS_CURRENCY,
    prices: [{ label: params.title, amount: params.amountStars }],
    // Digital goods paid with Stars require no provider_token.
  });
}

export async function answerPreCheckoutQuery(
  preCheckoutQueryId: string,
  ok: boolean,
  errorMessage?: string,
): Promise<void> {
  await callTelegram("answerPreCheckoutQuery", {
    pre_checkout_query_id: preCheckoutQueryId,
    ok,
    ...(errorMessage ? { error_message: errorMessage } : {}),
  });
}

export async function setWebhook(url: string, secretToken?: string): Promise<void> {
  await callTelegram("setWebhook", {
    url,
    allowed_updates: ["pre_checkout_query", "message"],
    ...(secretToken ? { secret_token: secretToken } : {}),
  });
}
