"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const LOGIN_WELCOME_TOAST_KEY = "show-login-welcome-toast";

export function markLoginWelcomeToast() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(LOGIN_WELCOME_TOAST_KEY, "1");
}

export default function LoginWelcomeToast() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [visible, setVisible] = useState(false);
  const userName = session?.user?.name?.trim() || "회원";

  useEffect(() => {
    if (
      status !== "authenticated" ||
      pathname !== "/" ||
      typeof window === "undefined"
    ) {
      return;
    }

    const shouldShow =
      window.sessionStorage.getItem(LOGIN_WELCOME_TOAST_KEY) === "1";

    if (!shouldShow) {
      return;
    }

    window.sessionStorage.removeItem(LOGIN_WELCOME_TOAST_KEY);
    setVisible(true);

    const timeoutId = window.setTimeout(() => {
      setVisible(false);
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [pathname, status]);

  if (!visible) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed left-1/2 top-24 z-70 -translate-x-1/2">
      <div className="rounded-lg bg-black/80 px-10 py-5 text-md font-medium text-background shadow-2xl">
        {userName}님 반가워요!
      </div>
    </div>
  );
}
