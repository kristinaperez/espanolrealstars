"use client";

import { useState } from "react";
import { Check, LogOut, RefreshCw, Star } from "lucide-react";
import { TelegramLoginButton } from "./telegram-login-button";
import { useTelegram } from "@/components/providers/telegram-provider";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const STATUS_LABEL: Record<string, string> = {
  idle: "",
  creating: "Создаём счёт…",
  opened: "Открыт счёт в Telegram…",
  polling: "Проверяем оплату…",
  paid: "Оплачено! 🎉",
  failed: "Не получилось создать счёт. Попробуйте ещё раз.",
  cancelled: "Оплата отменена.",
};

export function StarsPaywall() {
  const { config, ready, user, premium, loading, invoiceStatus, payWithStars, logout, refresh } = useTelegram();
  const [manualChecking, setManualChecking] = useState(false);

  if (!ready) return null;
  if (!config.enabled) return null;

  return (
    <div className="rounded-3xl border-2 border-[#229ED9]/35 bg-[#229ED9]/8 p-5">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[#229ED9] text-white">
          <TelegramGlyph />
        </span>
        <p className="text-sm font-bold">Оплата через Telegram Stars</p>
        {premium ? <Badge tone="success">Premium активен</Badge> : <Badge tone="info">{config.starsPrice} ⭐</Badge>}
      </div>

      {!user ? (
        <>
          <p className="mt-3 text-sm text-muted">
            Войдите через Telegram, чтобы оплатить курс {config.starsPrice} ⭐ Stars — без карты, прямо в приложении
            Telegram.
          </p>
          <div className="mt-4">
            <TelegramLoginButton />
          </div>
        </>
      ) : (
        <>
          <div className="mt-3 flex items-center gap-3">
            {user.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <span className="grid h-10 w-10 place-items-center rounded-full bg-background-soft text-lg">🙂</span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">
                {user.firstName} {user.lastName ?? ""}
              </p>
              <p className="truncate text-xs text-muted">{user.username ? `@${user.username}` : `id ${user.telegramId}`}</p>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-line text-muted hover:text-foreground"
              aria-label="Выйти из Telegram"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          {premium ? (
            <p className="mt-4 flex items-center gap-2 rounded-2xl bg-success-soft px-4 py-3 text-sm font-bold text-success">
              <Check className="h-4 w-4" /> Все 45 уроков открыты через Telegram Stars
            </p>
          ) : (
            <>
              <Button
                size="lg"
                block
                className="mt-4 bg-[#229ED9] text-white shadow-[0_4px_0_0_#1a7fb0] hover:brightness-105"
                onClick={payWithStars}
                disabled={loading || invoiceStatus === "creating" || invoiceStatus === "opened" || invoiceStatus === "polling"}
              >
                <Star className="h-5 w-5" /> Оплатить {config.starsPrice} ⭐ Stars
              </Button>
              {invoiceStatus !== "idle" ? (
                <p className="mt-2 text-center text-xs font-semibold text-muted">{STATUS_LABEL[invoiceStatus]}</p>
              ) : null}
              <button
                type="button"
                onClick={async () => {
                  setManualChecking(true);
                  await refresh();
                  setManualChecking(false);
                }}
                className="mt-3 flex w-full items-center justify-center gap-2 text-xs font-bold text-muted hover:text-foreground"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${manualChecking ? "animate-spin" : ""}`} /> Я оплатил(а) — проверить
                статус
              </button>
            </>
          )}
        </>
      )}
      <p className="mt-3 text-xs text-muted">
        Оплата обрабатывается Telegram: без ввода карты, без подписки. Разово {config.starsPrice} ⭐ — доступ навсегда.
      </p>
    </div>
  );
}

function TelegramGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
      <path
        d="M21.5 3.5 2.7 10.9c-1.2.5-1.2 1.2-.2 1.5l4.8 1.5 1.9 5.7c.2.6.4.8.9.8.4 0 .6-.2.9-.5l2.1-2 4.4 3.2c.8.4 1.3.2 1.5-.7l2.8-13.2c.3-1.1-.4-1.6-1.3-1.2Z"
        fill="currentColor"
      />
    </svg>
  );
}
