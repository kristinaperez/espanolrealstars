"use client";

import { useEffect, useRef } from "react";
import { useTelegram } from "@/components/providers/telegram-provider";

let counter = 0;

/** Renders the official Telegram Login Widget and pipes the result through our session API. */
export function TelegramLoginButton({ size = "large" }: { size?: "large" | "medium" | "small" }) {
  const { config, loginWithWidget } = useTelegram();
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackName = useRef(`onTelegramAuth${counter++}`);

  useEffect(() => {
    if (!config.botUsername || !containerRef.current) return;
    const container = containerRef.current;
    container.innerHTML = "";

    (window as unknown as Record<string, unknown>)[callbackName.current] = (user: Record<string, unknown>) => {
      void loginWithWidget(user);
    };

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", config.botUsername);
    script.setAttribute("data-size", size);
    script.setAttribute("data-userpic", "true");
    script.setAttribute("data-radius", "16");
    script.setAttribute("data-onauth", `${callbackName.current}(user)`);
    script.setAttribute("data-request-access", "write");
    container.appendChild(script);

    return () => {
      delete (window as unknown as Record<string, unknown>)[callbackName.current];
    };
  }, [config.botUsername, loginWithWidget, size]);

  if (!config.botUsername) return null;

  return <div ref={containerRef} className="inline-flex" />;
}
