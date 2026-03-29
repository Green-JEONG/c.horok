"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Send, X } from "lucide-react";
import Image from "next/image";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const INITIAL_MESSAGES: UIMessage[] = [
  {
    id: "horok-welcome",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "안녕하세요! 호록이에요. 궁금한 점이나 필요한 내용을 편하게 물어보세요.",
      },
    ],
  },
];

function getMessageText(
  parts: Array<{ type: string; text?: string; state?: string }> = [],
) {
  return parts
    .filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join("");
}

export default function HorokChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { messages, sendMessage, status, error, clearError } = useChat({
    messages: INITIAL_MESSAGES,
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const isLoading = status === "submitted" || status === "streaming";
  const hasMessages = useMemo(
    () =>
      messages.some((message) => getMessageText(message.parts).trim().length),
    [messages],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 150);

    return () => window.clearTimeout(timer);
  }, [isOpen]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = input.trim();
    if (!trimmed || isLoading) {
      return;
    }

    clearError();
    setInput("");
    await sendMessage({ text: trimmed });
  }

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-40 flex items-end justify-end sm:right-6 sm:bottom-6">
      <div className="relative flex flex-col items-end">
        <div
          className={cn(
            "pointer-events-auto absolute right-0 bottom-[calc(100%+0.75rem)] w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-[28px] border border-orange-100 bg-white transition-all duration-300 dark:border-orange-400/20 dark:bg-zinc-950",
            isOpen
              ? "translate-y-0 scale-100 opacity-100"
              : "pointer-events-none translate-y-4 scale-95 opacity-0",
          )}
        >
          <div className="bg-primary px-5 py-4 text-primary-foreground">
            <div className="flex items-center justify-between gap-3">
              <p className="text-base font-semibold">호록이 상담소</p>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full bg-white/15 p-2 text-primary-foreground transition hover:bg-white/25"
                aria-label="챗봇 닫기"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="flex h-[26rem] flex-col bg-[linear-gradient(180deg,#fff8f0_0%,#ffffff_28%)] dark:bg-[linear-gradient(180deg,#2c1f12_0%,#171717_24%)]">
            <div className="scrollbar-hide flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {hasMessages ? (
                messages.map((message) => {
                  const text = getMessageText(message.parts).trim();
                  if (!text) {
                    return null;
                  }

                  const isUser = message.role === "user";

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        isUser ? "justify-end" : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm",
                          isUser
                            ? "rounded-br-lg bg-orange-500 text-white dark:bg-orange-500 dark:text-white"
                            : "rounded-bl-lg border border-orange-100 bg-white text-slate-800 dark:border-orange-400/20 dark:bg-zinc-900 dark:text-zinc-100",
                        )}
                      >
                        {!isUser ? (
                          <p className="mb-1 text-[11px] font-semibold tracking-[0.08em] text-orange-500 dark:text-orange-300">
                            HOROK
                          </p>
                        ) : null}
                        <p className="whitespace-pre-wrap">{text}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
                  대화를 시작하면 호록 챗봇이 바로 응답합니다.
                </div>
              )}

              {isLoading ? (
                <div className="flex justify-start">
                  <div className="rounded-3xl rounded-bl-lg border border-orange-100 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm dark:border-orange-400/20 dark:bg-zinc-900 dark:text-zinc-300">
                    답변을 작성 중입니다...
                  </div>
                </div>
              ) : null}

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-300">
                  챗봇 연결 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.
                </div>
              ) : null}

              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={handleSubmit}
              className="border-t border-orange-100 p-3 dark:border-orange-400/20"
            >
              <div className="flex items-end gap-2 rounded-3xl border border-orange-200 bg-white p-2 shadow-sm dark:border-orange-400/25 dark:bg-zinc-900">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="호록이에게 물어보세요"
                  className="h-10 flex-1 bg-transparent px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="size-10 rounded-full"
                  disabled={!input.trim() || isLoading}
                  aria-label="메시지 전송"
                >
                  <Send className="size-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className="pointer-events-auto group relative block size-[72px] transition hover:-translate-y-0.5"
          aria-label={isOpen ? "챗봇 접기" : "챗봇 열기"}
        >
          <Image
            src="/logo.png"
            alt="호록 챗봇"
            width={72}
            height={72}
            className="size-full object-contain drop-shadow-[0_0_18px_rgba(255,154,0,0.82)] transition group-hover:drop-shadow-[0_0_28px_rgba(255,154,0,0.92)]"
            priority
          />
        </button>
      </div>
    </div>
  );
}
