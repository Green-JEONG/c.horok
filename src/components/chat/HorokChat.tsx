"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ChevronLeft, List, MessageSquarePlus, Send, X } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatThreadSummary = {
  id: string;
  title: string;
  preview: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
};

type ChatPayload = {
  isAuthenticated: boolean;
  activeThreadId: string | null;
  threads: ChatThreadSummary[];
  messages: UIMessage[];
};

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

function formatThreadTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
  }).format(date);
}

function getVisibleMessages(
  messages: UIMessage[],
  sessionStatus: "authenticated" | "loading" | "unauthenticated",
  activeThreadId: string | null,
) {
  if (sessionStatus !== "authenticated") {
    return messages.length > 0 ? messages : INITIAL_MESSAGES;
  }

  if (!activeThreadId) {
    return [];
  }

  return messages.length > 0 ? messages : INITIAL_MESSAGES;
}

export default function HorokChat() {
  const pathname = usePathname();
  const { status: sessionStatus } = useSession();
  const platform = pathname?.startsWith("/horok-cote") ? "cote" : "tech";
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [threads, setThreads] = useState<ChatThreadSummary[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [view, setView] = useState<"chat" | "threads">("chat");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const activeThreadIdRef = useRef<string | null>(null);

  const { messages, sendMessage, setMessages, status, error, clearError } =
    useChat({
      messages: INITIAL_MESSAGES,
      transport: new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages: nextMessages }) => ({
          body: {
            platform,
            threadId: activeThreadIdRef.current,
            message: nextMessages[nextMessages.length - 1],
          },
        }),
      }),
    });

  const visibleMessages = useMemo(
    () => getVisibleMessages(messages, sessionStatus, threadId),
    [messages, sessionStatus, threadId],
  );
  const isLoading =
    status === "submitted" ||
    status === "streaming" ||
    isHistoryLoading ||
    isCreatingThread;
  const hasMessages = useMemo(
    () =>
      visibleMessages.some(
        (message) => getMessageText(message.parts).trim().length > 0,
      ),
    [visibleMessages],
  );
  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === threadId) ?? null,
    [threadId, threads],
  );
  const isThreadMode = sessionStatus === "authenticated" && view === "threads";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  });

  useEffect(() => {
    if (!isOpen || isThreadMode) {
      return;
    }

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 150);

    return () => window.clearTimeout(timer);
  }, [isOpen, isThreadMode]);

  const applyActiveThread = useCallback((nextThreadId: string | null) => {
    activeThreadIdRef.current = nextThreadId;
    setThreadId(nextThreadId);
  }, []);

  const loadChatState = useCallback(
    async (nextThreadId?: string | null) => {
      if (sessionStatus !== "authenticated") {
        applyActiveThread(null);
        setThreads([]);
        setMessages(INITIAL_MESSAGES);
        return;
      }

      setIsHistoryLoading(true);

      try {
        const searchParams = new URLSearchParams({ platform });
        if (nextThreadId && /^\d+$/.test(nextThreadId)) {
          searchParams.set("threadId", nextThreadId);
        }

        const response = await fetch(`/api/chat?${searchParams.toString()}`, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load chat state");
        }

        const data = (await response.json()) as ChatPayload;

        setThreads(data.threads);
        applyActiveThread(data.activeThreadId);
        setMessages(data.activeThreadId ? data.messages : []);
      } catch (loadError) {
        console.error("Failed to load chat state", loadError);
        setThreads([]);
        applyActiveThread(null);
        setMessages([]);
      } finally {
        setIsHistoryLoading(false);
      }
    },
    [applyActiveThread, platform, sessionStatus, setMessages],
  );

  useEffect(() => {
    if (sessionStatus === "loading") {
      return;
    }

    if (sessionStatus !== "authenticated") {
      applyActiveThread(null);
      setThreads([]);
      setMessages(INITIAL_MESSAGES);
      setView("chat");
      return;
    }

    void loadChatState();
  }, [applyActiveThread, loadChatState, sessionStatus, setMessages]);

  async function handleSelectThread(nextThreadId: string) {
    if (nextThreadId === threadId) {
      setView("chat");
      return;
    }

    clearError();
    await loadChatState(nextThreadId);
    setView("chat");
  }

  async function handleCreateThread() {
    if (sessionStatus !== "authenticated" || isCreatingThread) {
      return;
    }

    setIsCreatingThread(true);

    try {
      const response = await fetch("/api/chat/threads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ platform }),
      });

      if (!response.ok) {
        throw new Error("Failed to create thread");
      }

      const data = (await response.json()) as {
        threadId: string;
      };

      applyActiveThread(data.threadId);
      setMessages([]);
      setInput("");
      setView("chat");
      await loadChatState(data.threadId);
    } catch (createError) {
      console.error("Failed to create thread", createError);
    } finally {
      setIsCreatingThread(false);
    }
  }

  async function ensureActiveThread() {
    if (sessionStatus !== "authenticated") {
      return null;
    }

    if (activeThreadIdRef.current) {
      return activeThreadIdRef.current;
    }

    setIsCreatingThread(true);

    try {
      const response = await fetch("/api/chat/threads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ platform }),
      });

      if (!response.ok) {
        throw new Error("Failed to create thread");
      }

      const data = (await response.json()) as {
        threadId: string;
      };

      applyActiveThread(data.threadId);
      setThreads((currentThreads) => [
        {
          id: data.threadId,
          title: "새 대화",
          preview: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messageCount: 0,
        },
        ...currentThreads,
      ]);

      return data.threadId;
    } finally {
      setIsCreatingThread(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = input.trim();
    if (!trimmed || isLoading) {
      return;
    }

    clearError();

    if (sessionStatus === "authenticated") {
      await ensureActiveThread();
    }

    setInput("");
    await sendMessage({ text: trimmed });

    if (sessionStatus === "authenticated") {
      await loadChatState(activeThreadIdRef.current);
    }
  }

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-40 flex items-end justify-end sm:right-6 sm:bottom-6">
      <div className="relative flex flex-col items-end">
        <div
          className={cn(
            "pointer-events-auto absolute right-0 bottom-[calc(100%+0.75rem)] w-[calc(100vw-2rem)] overflow-hidden rounded-[28px] border bg-white transition-all duration-300 dark:bg-zinc-950 sm:max-w-sm",
            platform === "cote"
              ? "border-[#06923E]/20 dark:border-[#06923E]/30"
              : "border-orange-100 dark:border-orange-400/20",
            isOpen
              ? "translate-y-0 scale-100 opacity-100"
              : "pointer-events-none translate-y-4 scale-95 opacity-0",
          )}
        >
          <div
            className={cn(
              "px-5 py-4 text-primary-foreground",
              platform === "cote" ? "bg-[#06923E]" : "bg-primary",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                {sessionStatus === "authenticated" ? (
                  <button
                    type="button"
                    onClick={() =>
                      setView((current) =>
                        current === "chat" ? "threads" : "chat",
                      )
                    }
                    className="rounded-full bg-white/15 p-2 text-primary-foreground transition hover:bg-white/25"
                    aria-label={
                      isThreadMode ? "대화창으로 돌아가기" : "대화 목록 보기"
                    }
                  >
                    {isThreadMode ? (
                      <ChevronLeft className="size-4" />
                    ) : (
                      <List className="size-4" />
                    )}
                  </button>
                ) : null}
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold">
                    호록이 상담소
                  </p>
                  <p className="truncate text-xs text-primary-foreground/80">
                    {isThreadMode
                      ? "저장된 대화 목록"
                      : (activeThread?.title ??
                        (sessionStatus === "authenticated"
                          ? "대화를 선택해 주세요."
                          : "궁금한 점을 바로 물어보세요."))}
                  </p>
                </div>
              </div>

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

          <div
            className={cn(
              "flex h-[30rem] flex-col",
              platform === "cote"
                ? "bg-[linear-gradient(180deg,#f3fff7_0%,#ffffff_24%)] dark:bg-[linear-gradient(180deg,#102316_0%,#171717_22%)]"
                : "bg-[linear-gradient(180deg,#fff8f0_0%,#ffffff_24%)] dark:bg-[linear-gradient(180deg,#2c1f12_0%,#171717_22%)]",
            )}
          >
            {isThreadMode ? (
              <>
                <div
                  className={cn(
                    "border-b p-3",
                    platform === "cote"
                      ? "border-[#06923E]/10 dark:border-[#06923E]/20"
                      : "border-orange-100/80 dark:border-orange-400/15",
                  )}
                >
                  <Button
                    type="button"
                    onClick={handleCreateThread}
                    disabled={isCreatingThread}
                    className={cn(
                      "h-10 w-full justify-center rounded-2xl",
                      platform === "cote"
                        ? "bg-[#06923E] text-white hover:bg-[#047a33]"
                        : undefined,
                    )}
                  >
                    <MessageSquarePlus className="size-4" />새 대화
                  </Button>
                </div>

                <div className="scrollbar-hide flex-1 overflow-y-auto p-3">
                  {threads.length > 0 ? (
                    threads.map((thread) => {
                      const isActive = thread.id === threadId;

                      return (
                        <button
                          key={thread.id}
                          type="button"
                          onClick={() => void handleSelectThread(thread.id)}
                          className={cn(
                            "mb-2 w-full rounded-2xl border px-3 py-3 text-left transition",
                            isActive
                              ? platform === "cote"
                                ? "border-[#06923E]/45 bg-white shadow-sm dark:border-[#06923E]/45 dark:bg-zinc-900"
                                : "border-orange-300 bg-white shadow-sm dark:border-orange-400/40 dark:bg-zinc-900"
                              : platform === "cote"
                                ? "border-transparent bg-white/70 hover:border-[#06923E]/25 hover:bg-white dark:bg-zinc-900/60 dark:hover:border-[#06923E]/25"
                                : "border-transparent bg-white/70 hover:border-orange-200 hover:bg-white dark:bg-zinc-900/60 dark:hover:border-orange-400/20",
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="line-clamp-2 text-sm font-semibold text-slate-800 dark:text-zinc-100">
                              {thread.title}
                            </p>
                            <span className="shrink-0 text-[11px] text-muted-foreground">
                              {formatThreadTime(thread.updatedAt)}
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                            {thread.preview || "아직 메시지가 없습니다."}
                          </p>
                        </button>
                      );
                    })
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                      <p className="text-sm font-medium text-slate-700 dark:text-zinc-100">
                        아직 저장된 대화가 없어요.
                      </p>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        새 대화를 눌러 스레드를 만들고 자유롭게 오가며 대화를
                        이어가세요.
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div
                  className={cn(
                    "border-b px-4 py-3",
                    platform === "cote"
                      ? "border-[#06923E]/10 dark:border-[#06923E]/20"
                      : "border-orange-100/80 dark:border-orange-400/15",
                  )}
                >
                  <p className="text-sm font-semibold text-slate-800 dark:text-zinc-100">
                    {activeThread?.title ??
                      (sessionStatus === "authenticated"
                        ? "대화를 선택해 주세요"
                        : "임시 대화")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {sessionStatus === "authenticated"
                      ? activeThread
                        ? "목록 아이콘으로 다른 스레드로 이동할 수 있어요."
                        : "제목 왼쪽 목록 아이콘을 눌러 원하는 대화창으로 이동하세요."
                      : "로그인하면 대화를 스레드별로 저장할 수 있어요."}
                  </p>
                </div>

                <div className="scrollbar-hide flex-1 space-y-3 overflow-y-auto px-4 py-4">
                  {sessionStatus === "authenticated" && !threadId ? (
                    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                      <p className="text-base font-semibold text-slate-800 dark:text-zinc-100">
                        대화 스레드를 선택해 주세요.
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        제목 왼쪽 목록 아이콘으로 목록 화면을 열고 원하는
                        대화창을 선택하면 됩니다.
                      </p>
                      <Button
                        type="button"
                        className={cn(
                          "mt-5 rounded-2xl",
                          platform === "cote"
                            ? "bg-[#06923E] text-white hover:bg-[#047a33]"
                            : undefined,
                        )}
                        onClick={() => setView("threads")}
                      >
                        <List className="size-4" />
                        대화 목록 보기
                      </Button>
                    </div>
                  ) : hasMessages ? (
                    visibleMessages.map((message) => {
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
                                ? platform === "cote"
                                  ? "rounded-br-lg bg-[#06923E] text-white dark:bg-[#06923E] dark:text-white"
                                  : "rounded-br-lg bg-orange-500 text-white dark:bg-orange-500 dark:text-white"
                                : platform === "cote"
                                  ? "rounded-bl-lg border border-[#06923E]/10 bg-white text-slate-800 dark:border-[#06923E]/20 dark:bg-zinc-900 dark:text-zinc-100"
                                  : "rounded-bl-lg border border-orange-100 bg-white text-slate-800 dark:border-orange-400/20 dark:bg-zinc-900 dark:text-zinc-100",
                            )}
                          >
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
                      <div
                        className={cn(
                          "rounded-3xl rounded-bl-lg border bg-white px-4 py-3 text-sm text-slate-500 shadow-sm dark:bg-zinc-900 dark:text-zinc-300",
                          platform === "cote"
                            ? "border-[#06923E]/10 dark:border-[#06923E]/20"
                            : "border-orange-100 dark:border-orange-400/20",
                        )}
                      >
                        답변을 작성 중입니다...
                      </div>
                    </div>
                  ) : null}

                  {error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-300">
                      챗봇 연결 중 문제가 발생했습니다. 잠시 후 다시 시도해
                      주세요.
                    </div>
                  ) : null}

                  {sessionStatus !== "authenticated" ? (
                    <div className="px-2 text-center text-xs leading-5 text-muted-foreground">
                      로그인하면 대화가 스레드 목록으로 저장되고 다시 이어서 볼
                      수 있습니다.
                    </div>
                  ) : null}

                  <div ref={messagesEndRef} />
                </div>

                <form
                  onSubmit={handleSubmit}
                  className={cn(
                    "border-t p-3",
                    platform === "cote"
                      ? "border-[#06923E]/10 dark:border-[#06923E]/20"
                      : "border-orange-100 dark:border-orange-400/20",
                  )}
                >
                  <div
                    className={cn(
                      "flex items-end gap-2 rounded-3xl border bg-white p-2 shadow-sm dark:bg-zinc-900",
                      platform === "cote"
                        ? "border-[#06923E]/25 dark:border-[#06923E]/30"
                        : "border-orange-200 dark:border-orange-400/25",
                    )}
                  >
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      placeholder={
                        sessionStatus === "authenticated" && !threadId
                          ? "대화 목록에서 스레드를 선택해 주세요"
                          : "호록이에게 물어보세요"
                      }
                      className="h-10 flex-1 bg-transparent px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className={cn(
                        "size-10 rounded-full",
                        platform === "cote"
                          ? "bg-[#06923E] text-white hover:bg-[#047a33]"
                          : undefined,
                      )}
                      disabled={!input.trim() || isLoading}
                      aria-label="메시지 전송"
                    >
                      <Send className="size-4" />
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>

        {platform === "cote" ? (
          <div
            className={cn(
              "pointer-events-none absolute right-2 bottom-[calc(100%+1rem)] transition-all duration-300",
              isOpen ? "translate-y-1 opacity-0" : "translate-y-0 opacity-100",
            )}
            aria-hidden="true"
          >
            <div className="relative min-w-[184px] rounded-2xl bg-[#06923E] px-2.5 py-2 text-center text-xs font-medium text-white shadow-lg">
              잘 모르겠으면 나에게 물어봐!
              <span className="absolute right-5 top-full h-0 w-0 border-x-[8px] border-t-[10px] border-x-transparent border-t-[#06923E]" />
            </div>
          </div>
        ) : null}

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
            className={cn(
              "size-full object-contain transition",
              platform === "cote"
                ? "drop-shadow-[0_0_18px_rgba(6,146,62,0.72)] group-hover:drop-shadow-[0_0_28px_rgba(6,146,62,0.88)]"
                : "drop-shadow-[0_0_18px_rgba(255,154,0,0.82)] group-hover:drop-shadow-[0_0_28px_rgba(255,154,0,0.92)]",
            )}
            priority
          />
        </button>
      </div>
    </div>
  );
}
