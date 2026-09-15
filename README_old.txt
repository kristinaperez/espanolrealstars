# Español Real

Коммерческий MVP веб-тренажёра разговорного испанского для жизни в Испании.
Контент берётся из авторского учебника; приложение полностью статичное и работает офлайн.

## Что внутри

| Блок | Реализовано |
| --- | --- |
| Контент | 45 уроков (`data/lessons/lesson001…045.json`), 360 фраз, 9 экзаменов |
| Упражнения | Карточки, обратные карточки, выбор перевода, вставка слова, сборка фразы, «верно/неверно», перевод с клавиатуры, мини-тест, экзамен |
| Повторение | Интервалы 1 → 3 → 7 → 30 → 90 дней, очередь ошибок, дневное повторение |
| Геймификация | XP, уровни (Новичок → Native Killer), серия дней, комбо-бонусы, 15 достижений, календарь, цель дня, сердечки (опция, выключены) |
| Карта адаптации | 11 этапов жизни в Испании: от «Первых дней» до «Чувствую себя как дома» |
| Монетизация | 7 бесплатных уроков + Premium разово: 15 € по лицензионному ключу `XXXX-XXXX-XXXX` **или** 500 ⭐ Telegram Stars |
| Telegram | Вход через Login Widget / Mini App, оплата Stars, подтверждение вебхуком — без доверия клиенту |
| Прогресс | localStorage: уроки, ошибки, XP, серия, расписание повторения, достижения, дата старта триала, ключ Premium |
| SEO | robots.txt, sitemap.xml, Open Graph, Twitter cards, Schema.org (Course / LearningResource), метатеги каждого урока |
| PWA | manifest, service worker, офлайн-режим, установка на телефон |

## Стек

Next.js (App Router) · React 19 · TypeScript · Tailwind CSS v4 · компоненты в стиле shadcn/ui.

Ядро курса (уроки, упражнения, прогресс) по-прежнему работает без бэкенда — всё в localStorage.
Postgres + несколько API-роутов добавлены **только** для Telegram-входа и Stars-платежей, которые физически не могут
быть проверены на клиенте (нужен секрет бота). Без настроенного бота приложение ведёт себя как раньше: без БД, без
авторизации, чисто статический контент + localStorage.

## Добавление уроков (масштаб до 500+)

1. Положите JSON-файл в `data/lessons/` — например `lesson046.json` (или `lesson46.json`, вложенные папки тоже сканируются).
2. Соберите проект — урок автоматически появится в списке уроков, на карте адаптации, в поиске, в sitemap, в экзаменах и в прогрессе курса.

Никакого кода менять не нужно: маршруты, упражнения, экзамены, карта, статистика и SEO генерируются из данных.

Формат файла:

```json
{
  "lesson": 46,
  "slug": "mi-barrio",
  "title": "Mi barrio",
  "subtitle": "Короткое описание",
  "category": "daily-life",
  "milestone": "belonging",
  "difficulty": "B1",
  "tags": ["daily life"],
  "summary": "О чём урок",
  "situation": "Ситуация, в которой пригодится",
  "authorComment": "Комментарий автора метода",
  "phrases": [
    {
      "spanish": "Me cuentas",
      "translation": "Расскажешь мне",
      "example": "Lo haces y me cuentas.",
      "exampleTranslation": "Ты это делаешь, а потом расскажешь мне.",
      "notes": "Очень частая разговорная фраза.",
      "difficulty": "A1",
      "tags": ["daily life", "pronouns"]
    }
  ]
}
```

Справочники (категории, этапы адаптации, уровни, достижения, XP, цены, FAQ, отзывы, навигация)
лежат в `data/course.config.json` — тоже данные, а не код.

## Сборка и деплой

```bash
npm install
npm run dev                 # разработка
npm run build               # обычная сборка (режим платформенного превью с /api/health)
STATIC_EXPORT=true npm run build   # статический экспорт в ./out
```

Статическую папку `out/` можно выложить на **Netlify**, **Cloudflare Pages**, **GitHub Pages** или **Render Static**.
Для GitHub Pages задайте `NEXT_PUBLIC_SITE_URL` (домен сайта) перед сборкой — он используется в canonical, OG и sitemap.

## Telegram: вход и оплата звёздами (500 ⭐ за Premium)

После урока 7 в приложении доступны **два способа** открыть Premium: лицензионный ключ (offline) и **оплата Telegram Stars** —
она требует входа через Telegram (Login Widget на сайте или автоматически внутри Telegram Mini App).

### Как это работает

1. **Вход.** На сайте пользователь нажимает кнопку официального Telegram Login Widget → Telegram подписывает данные →
   мы проверяем подпись на сервере (`src/lib/telegram/verify.ts`) и выдаём httpOnly-сессионную куку.
   Если приложение открыто как Telegram Mini App, вход происходит автоматически через `WebApp.initData` — без кнопок.
2. **Оплата.** Клиент запрашивает `/api/telegram/create-invoice` → сервер вызывает `createInvoiceLink` Bot API
   (валюта `XTR`, 500 звёзд, без `provider_token` — Stars не требуют платёжного провайдера).
   Внутри Mini App счёт открывается нативно через `Telegram.WebApp.openInvoice()`; в обычном браузере — открывается
   ссылка на бота в новой вкладке.
3. **Подтверждение.** Telegram шлёт вебхуку `pre_checkout_query` (мы отвечаем `ok:true` за секунды) и затем
   `successful_payment` — только тогда сервер помечает пользователя premium в базе. Клиент никогда не может
   «сам себе» выдать доступ — источник истины всегда сервер + Postgres (`telegram_users`, `telegram_payments`).

### Настройка (BotFather)

```
/newbot                → создать бота, получить TELEGRAM_BOT_TOKEN
/setdomain              → указать https-домен сайта (нужно для Login Widget)
/newapp или Bot Settings → Menu Button → указать URL Mini App (тот же сайт), если хотите открывать курс внутри Telegram
```

Заполните `.env`:

```
TELEGRAM_BOT_TOKEN=123456:AA...
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=your_bot_username   # без @
TELEGRAM_WEBHOOK_SECRET=любая-случайная-строка         # опционально, но рекомендуется
AUTH_SECRET=ещё-одна-случайная-строка                  # подпись сессионной куки
NEXT_PUBLIC_SITE_URL=https://espanolfrase.netlify.app
```

Затем зарегистрируйте вебхук (один раз на прод-домене):

```bash
TELEGRAM_BOT_TOKEN=123456:AA... node scripts/setup-telegram-webhook.mjs https://ваш-домен ваш-webhook-secret
```

Если переменные не заданы — Telegram-блоки в интерфейсе автоматически скрываются (`/api/telegram/config` возвращает
`enabled:false`), а лицензионный ключ продолжает работать как раньше. Ничего не ломается на хостингах без бота.

### Важно про статический экспорт

Вход и оплата требуют секрет бота, куки и базу данных — то есть Node.js-сервер (обычная сборка `next build`/`next start`,
как в `build_and_start`). Режим `STATIC_EXPORT=true` (чисто статический сайт без сервера) по-прежнему доступен для
бесплатных хостингов, но в нём работает только оплата лицензионным ключом — `/api/telegram/*` недоступны без сервера.

## Лицензионные ключи

Stripe пока не подключён (по заданию). Вместо этого — офлайн-ключи:

```bash
node scripts/generate-license-keys.mjs 20          # 20 ключей
node scripts/generate-license-keys.mjs 5 --prefix=ESPA
```

Ключ вводится в разделе **Настройки → Premium**. Проверка (`src/lib/license.ts`) — контрольная сумма по алфавиту без похожих символов.
Опционально можно задать «мастер-ключ» в переменной `NEXT_PUBLIC_MASTER_LICENSE_KEY`.

## Архитектура (готовность к SaaS)

```
data/                     # весь контент (JSON)
src/lib/content/          # загрузчик контента (fs, только build-time) + типы + course.config
src/lib/exercises/        # генератор упражнений из фраз (данные → упражнения)
src/lib/srs.ts            # интервальное повторение
src/lib/progress/         # состояние, редьюсер, селекторы, localStorage
src/lib/license.ts        # адаптер монетизации №1: офлайн-ключ (замена на Stripe = 1 файл)
src/lib/telegram/         # адаптер монетизации №2: Telegram Login + Stars (verify/session/bot-api/store)
src/app/api/telegram/     # login-widget, miniapp-auth, create-invoice, webhook, status, session
src/db/schema.ts          # telegram_users, telegram_payments (единственные таблицы БД)
src/components/trainer/   # движок тренировки (универсальный для уроков/экзаменов/повторения)
src/components/telegram/  # Login Widget + Stars paywall UI
src/components/learn/     # экраны приложения
src/app/lesson/[n]        # статический URL /lesson/1 … /lesson/45
src/app/exam/[n]          # экзамены каждые 5 уроков
```

Чтобы добавить Supabase, полноценные аккаунты, Stripe, AI-диалоги, распознавание речи или учительскую панель,
достаточно заменить `src/lib/progress/storage.ts` (синхронизация прогресса) и расширить `src/lib/telegram/store.ts` —
фронтенд, контент и остальная монетизация остаются без изменений. Ключ и Stars — два независимых, взаимозаменяемых
адаптера доступа: `useProgress().premium` объединяет оба источника (`state.license || telegram.premium`).

## Права

Учебные материалы принадлежат автору учебника и защищены авторским правом.
