"use client";

import { Check, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

const LOGIN_WELCOME_TOAST_KEY = "show-login-welcome-toast";

export function markLoginWelcomeToast() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(LOGIN_WELCOME_TOAST_KEY, "1");
}

export default function LoginWelcomeToast() {
  const { data: session, status } = useSession();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const userName = session?.user?.name?.trim() || "회원";

  const closeToast = useCallback(() => {
    setClosing(true);
    window.setTimeout(() => {
      setVisible(false);
      setClosing(false);
    }, 260);
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || typeof window === "undefined") {
      return;
    }

    const shouldShow =
      window.sessionStorage.getItem(LOGIN_WELCOME_TOAST_KEY) === "1";

    if (!shouldShow) {
      return;
    }

    window.sessionStorage.removeItem(LOGIN_WELCOME_TOAST_KEY);
    setVisible(true);
    setClosing(false);

    const timeoutId = window.setTimeout(() => {
      closeToast();
    }, 10_000);

    return () => window.clearTimeout(timeoutId);
  }, [closeToast, status]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={`fixed left-1/2 top-24 z-70 w-[min(340px,calc(100vw-40px))] -translate-x-1/2 transition-all duration-250 ease-out ${
        closing ? "-translate-y-4 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div className="relative flex items-center gap-3 rounded-md border border-transparent bg-white px-5 py-4 text-zinc-500 shadow-[0_12px_28px_rgba(0,0,0,0.16)] dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:shadow-[0_16px_32px_rgba(0,0,0,0.42)]">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#13c51b] text-white">
          <Check className="h-5.5 w-5.5 stroke-[3]" />
        </span>
        <p className="min-w-0 truncate pr-5 text-base font-medium tracking-normal">
          {userName}님 환영합니다!
        </p>
        <button
          type="button"
          onClick={closeToast}
          className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center text-zinc-400 transition hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200"
          aria-label="토스트 닫기"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
