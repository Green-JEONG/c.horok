"use client";

import { useEffect, useMemo, useState } from "react";
import type { PlatformKind } from "@/components/mypage/usePlatformProfile";
import { normalizeNickname, validateNickname } from "@/lib/nickname";

type NicknameStatus =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "invalid"
  | "error";

type UseNicknameAvailabilityParams = {
  nickname: string;
  excludeUserId?: string;
  initialNickname?: string;
  enabled?: boolean;
  platform?: PlatformKind;
};

export function useNicknameAvailability({
  nickname,
  excludeUserId,
  initialNickname,
  enabled = true,
  platform,
}: UseNicknameAvailabilityParams) {
  const normalizedNickname = useMemo(
    () => normalizeNickname(nickname),
    [nickname],
  );
  const normalizedInitialNickname = useMemo(
    () => normalizeNickname(initialNickname ?? ""),
    [initialNickname],
  );
  const [status, setStatus] = useState<NicknameStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      setMessage(null);
      return;
    }

    const validationMessage = validateNickname(normalizedNickname);
    if (validationMessage) {
      setStatus(normalizedNickname ? "invalid" : "idle");
      setMessage(normalizedNickname ? validationMessage : null);
      return;
    }

    if (
      normalizedInitialNickname &&
      normalizedNickname === normalizedInitialNickname
    ) {
      setStatus("available");
      setMessage("현재 사용 중인 닉네임입니다.");
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setStatus("checking");
      setMessage("닉네임을 확인하는 중입니다.");

      try {
        const params = new URLSearchParams({ name: normalizedNickname });
        if (excludeUserId) {
          params.set("excludeUserId", excludeUserId);
        }

        const endpoint = platform
          ? `/api/platform-profile/check-name?${params.toString()}&platform=${platform}`
          : `/api/users/check-name?${params.toString()}`;
        const response = await fetch(endpoint, {
          signal: controller.signal,
        });
        const data = (await response.json().catch(() => ({}))) as {
          available?: boolean;
          message?: string;
        };

        if (!response.ok) {
          setStatus("error");
          setMessage(data.message ?? "닉네임 확인에 실패했습니다.");
          return;
        }

        if (data.available) {
          setStatus("available");
          setMessage(data.message ?? "사용 가능한 닉네임입니다.");
          return;
        }

        setStatus("taken");
        setMessage(data.message ?? "이미 사용 중인 닉네임입니다.");
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "닉네임 확인에 실패했습니다.",
        );
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [
    enabled,
    excludeUserId,
    normalizedInitialNickname,
    normalizedNickname,
    platform,
  ]);

  return {
    normalizedNickname,
    status,
    message,
    isAvailable: status === "available",
    isChecking: status === "checking",
  };
}
