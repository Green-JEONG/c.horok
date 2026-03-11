"use client";

import { useEffect, useMemo, useState } from "react";

type EmailStatus =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "invalid"
  | "error";

type UseEmailAvailabilityParams = {
  email: string;
  enabled?: boolean;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function validateEmail(email: string) {
  if (!email) {
    return null;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "올바른 이메일 형식을 입력해주세요.";
  }

  return null;
}

export function useEmailAvailability({
  email,
  enabled = true,
}: UseEmailAvailabilityParams) {
  const normalizedEmail = useMemo(() => normalizeEmail(email), [email]);
  const [status, setStatus] = useState<EmailStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      setMessage(null);
      return;
    }

    const validationMessage = validateEmail(normalizedEmail);
    if (validationMessage) {
      setStatus(normalizedEmail ? "invalid" : "idle");
      setMessage(normalizedEmail ? validationMessage : null);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setStatus("checking");
      setMessage("이메일을 확인하는 중입니다.");

      try {
        const params = new URLSearchParams({ email: normalizedEmail });
        const response = await fetch(
          `/api/users/check-email?${params.toString()}`,
          { signal: controller.signal },
        );
        const data = (await response.json().catch(() => ({}))) as {
          available?: boolean;
          message?: string;
        };

        if (!response.ok) {
          setStatus("error");
          setMessage(data.message ?? "이메일 확인에 실패했습니다.");
          return;
        }

        if (data.available) {
          setStatus("available");
          setMessage(data.message ?? "사용 가능한 이메일입니다.");
          return;
        }

        setStatus("taken");
        setMessage(data.message ?? "이미 사용 중인 이메일입니다.");
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "이메일 확인에 실패했습니다.",
        );
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [enabled, normalizedEmail]);

  return {
    normalizedEmail,
    status,
    message,
    isAvailable: status === "available",
    isChecking: status === "checking",
  };
}
