#!/usr/bin/env node
/**
 * Registers the bot webhook with Telegram.
 *
 * Usage:
 *   TELEGRAM_BOT_TOKEN=xxx node scripts/setup-telegram-webhook.mjs https://yourdomain.com [webhookSecret]
 */
const [, , url, secret] = process.argv;
const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error("Set TELEGRAM_BOT_TOKEN in the environment.");
  process.exit(1);
}
if (!url) {
  console.error("Usage: node scripts/setup-telegram-webhook.mjs https://yourdomain.com [webhookSecret]");
  process.exit(1);
}

const webhookUrl = `${url.replace(/\/$/, "")}/api/telegram/webhook`;

const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: webhookUrl,
    allowed_updates: ["pre_checkout_query", "message"],
    ...(secret ? { secret_token: secret } : {}),
  }),
});

const json = await res.json();
console.log(JSON.stringify(json, null, 2));
if (!json.ok) process.exit(1);
console.log(`\nWebhook registered: ${webhookUrl}`);
