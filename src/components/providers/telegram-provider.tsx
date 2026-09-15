"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { TelegramUser } from "@/lib/telegram/types";
import "@/lib/telegram/webapp.d.ts";

interface TelegramConfig {
  enabled: boolean;
  botUsername: string | null;
  starsPrice: number;
}

type InvoiceStatus = "idle" | "creating" | "opened" | "polling" | "paid" | "failed" | "cancelled";

interface TelegramContextValue {
  ready: boolean;
  config: TelegramConfig;
  isMiniApp: boolean;
  user: TelegramUser | null;
  premium: boolean;
  loading: boolean;
  invoiceStatus: InvoiceStatus;
  loginWithWidget: (payload: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  payWithStars: () => Promise<void>;
  refresh: () => Promise<void>;
}

const defaultConfig: TelegramConfig = { enabled: false, botUsername: null, starsPrice: 500 };

const TelegramContext = createContext<TelegramContextValue>({
  ready: true,
  config: defaultConfig,
  isMiniApp: false,
  user: null,
  premium: false,
  loading: false,
  invoiceStatus: "idle",
  loginWithWidget: async () => undefined,
  logout: async () => undefined,
  payWithStars: async () => undefined,
  refresh: async () => undefined,
});

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [config, setConfig] = useState<TelegramConfig>(defaultConfig);
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [invoiceStatus, setInvoiceStatus] = useState<InvoiceStatus>("idle");

  // Feature-detect: fetch config once. If the API isn't present (static
  // export / no bot token) this fails silently and Telegram UI stays hidden.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/telegram/config")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: TelegramConfig | null) => {
        if (!cancelled && data) setConfig(data);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/telegram/session");
      if (!res.ok) return;
      const data = (await res.json()) as { user: TelegramUser | null };
      setUser(data.user);
    } catch {
      /* offline or static export — ignore */
    }
  }, []);

  // Silent login inside a Telegram Mini App using WebApp.initData.
  useEffect(() => {
    if (!config.enabled) return;
    const webApp = window.Telegram?.WebApp;
    if (!webApp || !webApp.initData) {
      fetchSession();
      return;
    }
    setIsMiniApp(true);
    webApp.ready();
    webApp.expand();
    setLoading(true);
    fetch("/api/telegram/miniapp-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: webApp.initData }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { user: TelegramUser } | null) => {
        if (data) setUser(data.user);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.enabled]);

  const loginWithWidget = useCallback(async (payload: Record<string, unknown>) => {
    setLoading(true);
    try {
      const res = await fetch("/api/telegram/login-widget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = (await res.json()) as { user: TelegramUser };
        setUser(data.user);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/telegram/logout", { method: "POST" }).catch(() => undefined);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    await fetchSession();
  }, [fetchSession]);

  const payWithStars = useCallback(async () => {
    setInvoiceStatus("creating");
    try {
      const res = await fetch("/api/telegram/create-invoice", { method: "POST" });
      if (!res.ok) {
        setInvoiceStatus("failed");
        return;
      }
      const { link } = (await res.json()) as { link: string };
      const webApp = window.Telegram?.WebApp;

      if (webApp?.openInvoice) {
        setInvoiceStatus("opened");
        webApp.openInvoice(link, async (status) => {
          if (status === "paid") {
            setInvoiceStatus("polling");
            await pollForPremium(fetchSession, setUser);
            setInvoiceStatus("paid");
            webApp.HapticFeedback?.notificationOccurred("success");
          } else if (status === "cancelled") {
            setInvoiceStatus("cancelled");
          } else {
            setInvoiceStatus("failed");
          }
        });
      } else {
        window.open(link, "_blank", "noopener,noreferrer");
        setInvoiceStatus("opened");
      }
    } catch {
      setInvoiceStatus("failed");
    }
  }, [fetchSession]);

  const value = useMemo<TelegramContextValue>(
    () => ({
      ready,
      config,
      isMiniApp,
      user,
      premium: user?.premium ?? false,
      loading,
      invoiceStatus,
      loginWithWidget,
      logout,
      payWithStars,
      refresh,
    }),
    [config, invoiceStatus, isMiniApp, loading, loginWithWidget, logout, payWithStars, ready, refresh, user],
  );

  return <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>;
}

async function pollForPremium(
  fetchSession: () => Promise<void>,
  setUser: (user: TelegramUser | null) => void,
) {
  for (let attempt = 0; attempt < 6; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    try {
      const res = await fetch("/api/telegram/status");
      if (res.ok) {
        const data = (await res.json()) as { user: TelegramUser | null };
        if (data.user) {
          setUser(data.user);
          if (data.user.premium) return;
        }
      }
    } catch {
      /* keep polling */
    }
  }
  await fetchSession();
}

export function useTelegram() {
  return useContext(TelegramContext);
}
