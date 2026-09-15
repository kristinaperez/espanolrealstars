"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Check, Download, KeyRound, ShieldCheck, Upload } from "lucide-react";
import { Badge, Card, Input, Switch } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProgress } from "@/components/providers/progress-provider";
import { useTelegram } from "@/components/providers/telegram-provider";
import { StarsPaywall } from "@/components/telegram/stars-paywall";
import { course, pricing } from "@/lib/content/config";
import { formatKey, isValidKey } from "@/lib/license";
import { exportProgress, importProgress } from "@/lib/progress/storage";
import { cn } from "@/lib/utils";

export function SettingsView() {
  const { state, dispatch, ready, premium } = useProgress();
  const { config: telegramConfig, ready: telegramReady, premium: telegramPremium } = useTelegram();
  const [key, setKey] = useState("");
  const [keyError, setKeyError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const activate = () => {
    if (isValidKey(key)) {
      dispatch({ type: "activate", key: formatKey(key) });
      setKeyError(null);
      setKey("");
    } else {
      setKeyError("Ключ не распознан. Формат: XXXX-XXXX-XXXX");
    }
  };

  const download = () => {
    const blob = new Blob([exportProgress(state)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "espanol-real-progress.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const upload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const next = importProgress(String(reader.result));
        dispatch({ type: "reset" });
        window.localStorage.setItem("espanol-real:progress:v1", JSON.stringify(next));
        window.location.reload();
      } catch {
        setImportError("Не удалось прочитать файл прогресса");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Настройки</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Профиль и доступ</h1>
        <p className="mt-2 text-sm text-muted">
          Всё хранится локально в браузере — без аккаунтов и серверов. Можно перенести прогресс на другое устройство.
        </p>
      </header>

      <Card className="flex flex-col gap-4">
        <p className="text-sm font-bold">Ученик</p>
        <label className="flex flex-col gap-2 text-sm font-semibold">
          Имя для сертификата
          <Input
            value={state.settings.studentName}
            onChange={(event) => dispatch({ type: "setSettings", patch: { studentName: event.target.value } })}
            placeholder="Например: Irina"
          />
        </label>
        <div>
          <p className="text-sm font-bold">Цель на день</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[10, 25, 50, 100].map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => dispatch({ type: "setDailyGoal", value: goal })}
                className={cn(
                  "rounded-2xl border px-4 py-2 text-sm font-bold transition",
                  state.dailyGoal === goal
                    ? "border-primary bg-primary text-primary-contrast"
                    : "border-line bg-surface text-muted hover:border-primary/40",
                )}
              >
                {goal} XP
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <p className="text-sm font-bold">Интерфейс</p>
        <div>
          <p className="text-sm font-semibold">Тема</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["light", "dark", "system"] as const).map((theme) => (
              <button
                key={theme}
                type="button"
                onClick={() => dispatch({ type: "setSettings", patch: { theme } })}
                className={cn(
                  "rounded-2xl border px-4 py-2 text-sm font-bold transition",
                  state.settings.theme === theme
                    ? "border-primary bg-primary text-primary-contrast"
                    : "border-line bg-surface text-muted hover:border-primary/40",
                )}
              >
                {theme === "light" ? "☀️ Светлая" : theme === "dark" ? "🌙 Тёмная" : "🖥 Системная"}
              </button>
            ))}
          </div>
        </div>
        <SettingRow
          title="Звуковые эффекты"
          description="Короткие сигналы на правильный и неправильный ответ."
          checked={state.settings.sound}
          onChange={(sound) => dispatch({ type: "setSettings", patch: { sound } })}
        />
        <SettingRow
          title="Сердечки (5 жизней)"
          description="Экспериментальный режим: ошибка отнимает сердце, восстановление каждые 4 часа."
          checked={state.settings.hearts}
          onChange={(hearts) => dispatch({ type: "setSettings", patch: { hearts } })}
        />
        {state.settings.hearts ? (
          <p className="rounded-2xl bg-background-soft px-4 py-3 text-sm font-semibold">
            ❤️ Доступно: {state.hearts.count}
          </p>
        ) : null}
      </Card>

      <Card id="premium" className={premium ? "border-success/40 bg-success/8" : "border-primary/35 bg-primary/8"}>
        <div className="flex items-center gap-2">
          {premium ? <ShieldCheck className="h-5 w-5 text-success" /> : <KeyRound className="h-5 w-5 text-primary" />}
          <p className="text-sm font-bold">
            {premium ? "Premium активен" : `Premium · 15 € или ${telegramConfig.starsPrice} ⭐`}
          </p>
        </div>

        {premium ? (
          <>
            <p className="mt-3 text-sm text-muted">
              Все {course.freeLessonCount > 0 ? "45" : ""} уроков, экзамены и система повторения открыты. Спасибо за
              поддержку проекта!
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {state.license ? (
                <>
                  <Badge tone="success">
                    <Check className="h-3.5 w-3.5" /> {state.license.key}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "deactivate" })}
                    className="text-xs font-bold text-muted underline"
                  >
                    Отключить ключ
                  </button>
                </>
              ) : telegramPremium ? (
                <Badge tone="success">
                  <Check className="h-3.5 w-3.5" /> Оплачено через Telegram Stars
                </Badge>
              ) : null}
            </div>
          </>
        ) : (
          <>
            {telegramReady && telegramConfig.enabled ? (
              <div className="mt-4">
                <StarsPaywall />
              </div>
            ) : null}
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-muted">Или лицензионный ключ</p>
            <p className="mt-3 text-sm text-muted">
              Введите лицензионный ключ формата XXXX-XXXX-XXXX. Архитектура уже готова к подключению Stripe: ключ
              легко заменяется оплатой.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Input
                value={key}
                onChange={(event) => {
                  setKey(event.target.value.toUpperCase());
                  setKeyError(null);
                }}
                placeholder="XXXX-XXXX-XXXX"
                className="font-mono tracking-widest"
              />
              <Button size="lg" onClick={activate}>
                Активировать
              </Button>
            </div>
            {keyError ? <p className="mt-2 text-sm font-semibold text-danger">{keyError}</p> : null}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-line bg-surface p-4">
                <p className="text-sm font-bold">{pricing.free.title}</p>
                <p className="text-xs text-muted">{pricing.free.period}</p>
                <ul className="mt-2 flex flex-col gap-1 text-sm text-muted">
                  {pricing.free.features.slice(0, 3).map((feature) => (
                    <li key={feature}>· {feature}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border-2 border-primary/40 bg-surface p-4">
                <p className="text-sm font-bold">{pricing.premium.title}</p>
                <p className="text-xs text-muted">{pricing.premium.period}</p>
                <ul className="mt-2 flex flex-col gap-1 text-sm text-muted">
                  {pricing.premium.features.slice(0, 4).map((feature) => (
                    <li key={feature}>· {feature}</li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted">{pricing.premium.note}</p>
          </>
        )}
      </Card>

      <Card className="flex flex-col gap-4">
        <p className="text-sm font-bold">Данные прогресса</p>
        <p className="text-sm text-muted">
          Начало пробного периода: {new Date(state.createdAt).toLocaleDateString("ru-RU")}. XP: {state.xp}.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary" onClick={download}>
            <Download className="h-5 w-5" /> Скачать резервную копию
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            <Upload className="h-5 w-5" /> Восстановить из файла
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) upload(file);
            }}
          />
        </div>
        {importError ? <p className="text-sm font-semibold text-danger">{importError}</p> : null}
        <Button
          variant="danger"
          onClick={() => {
            if (window.confirm("Сбросить весь прогресс, XP и достижения?")) {
              dispatch({ type: "reset" });
            }
          }}
        >
          Сбросить прогресс
        </Button>
      </Card>

      <Card className="flex flex-col gap-2">
        <p className="text-sm font-bold">Офлайн и установка</p>
        <p className="text-sm text-muted">
          Приложение работает без интернета и устанавливается как PWA: в браузере нажмите «Установить приложение» или
          «Добавить на главный экран».
        </p>
        <Link href="/learn/about" className="text-sm font-bold text-primary underline decoration-primary/40">
          О курсе и методе →
        </Link>
      </Card>

      {!ready ? <p className="text-xs text-muted">Загрузка…</p> : null}
    </div>
  );
}

function SettingRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted">{description}</p>
      </div>
      <Switch checked={checked} onChange={onChange} label={title} />
    </div>
  );
}
