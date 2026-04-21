import { google } from "@ai-sdk/google";
import { Prisma } from "@prisma/client";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import { getDbUserIdFromSession } from "@/lib/auth-db";
import {
  appendChatMessage,
  createChatThread,
  getChatMessages,
  getChatThreadById,
  getLatestChatThreadByUserId,
  listChatThreadsByUserId,
  updateChatThreadTitle,
} from "@/lib/chat";

export const maxDuration = 30;

function isChatPersistenceError(error: unknown) {
  return (
    (error instanceof Error &&
      error.message === "CHAT_PERSISTENCE_CLIENT_OUTDATED") ||
    (error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2021" || error.code === "P2022"))
  );
}

function getMessageText(
  parts: Array<{ type: string; text?: string; state?: string }> = [],
) {
  return parts
    .filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join("")
    .trim();
}

function buildThreadTitle(text: string) {
  return text.replace(/\s+/g, " ").trim().slice(0, 60) || null;
}

export async function GET(req: Request) {
  try {
    const userId = await getDbUserIdFromSession();
    if (!userId) {
      return Response.json({
        isAuthenticated: false,
        activeThreadId: null,
        threads: [],
        messages: [],
      });
    }

    const url = new URL(req.url);
    const requestedThreadId = url.searchParams.get("threadId");
    const threads = await listChatThreadsByUserId(userId);

    const requestedThread =
      requestedThreadId && /^\d+$/.test(requestedThreadId)
        ? await getChatThreadById(userId, requestedThreadId)
        : null;

    const activeThread =
      requestedThread ??
      (threads.length > 0 ? await getLatestChatThreadByUserId(userId) : null);

    const messages = activeThread ? await getChatMessages(activeThread.id) : [];

    return Response.json({
      isAuthenticated: true,
      activeThreadId: activeThread?.id ?? null,
      threads,
      messages,
    });
  } catch (error) {
    if (isChatPersistenceError(error)) {
      console.warn("/api/chat GET persistence unavailable", error);

      return Response.json({
        isAuthenticated: true,
        activeThreadId: null,
        threads: [],
        messages: [],
      });
    }

    console.error("/api/chat GET error", error);

    return Response.json(
      { error: "대화 내역을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const {
      message,
      threadId,
    }: {
      message?: UIMessage;
      threadId?: string | null;
    } = await req.json();

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return Response.json(
        { error: "GOOGLE_GENERATIVE_AI_API_KEY is not configured." },
        { status: 500 },
      );
    }

    const userText = getMessageText(message?.parts);
    if (!message || message.role !== "user" || !userText) {
      return Response.json(
        { error: "유효한 사용자 메시지가 필요합니다." },
        { status: 400 },
      );
    }

    const userId = await getDbUserIdFromSession();
    let persistedThreadId: string | null = null;
    let previousMessages: UIMessage[] = [];

    if (userId) {
      try {
        const selectedThread =
          threadId && /^\d+$/.test(threadId)
            ? await getChatThreadById(userId, threadId)
            : null;

        const thread = selectedThread ?? (await createChatThread(userId));
        persistedThreadId = thread.id;
        previousMessages = await getChatMessages(thread.id);

        await appendChatMessage({
          threadId: thread.id,
          role: "user",
          content: userText,
        });

        if (!thread.title || thread.title === "새 대화") {
          await updateChatThreadTitle(thread.id, buildThreadTitle(userText));
        }
      } catch (error) {
        if (!isChatPersistenceError(error)) {
          throw error;
        }

        console.warn("/api/chat POST persistence unavailable", error);
      }
    }

    const allMessages = [...previousMessages, message];

    const result = await streamText({
      model: google("gemini-2.5-flash"),
      system: [
        "답변은 항상 한국어로 작성한다.",
        "친절하고 간결하게 답하되, 필요한 경우에는 핵심을 짧게 정리한다.",
        "답변에 유머를 섞어도 좋지만, 지나치게 가볍거나 진지하지 않도록 주의한다.",
        "너의 성별은 비밀이다.",
        "너의 생년월일은 2024년 8월 2일이다.",
        "너를 만든 사람은 그린님이다",
        "너는 호록 컴퍼니의 마스코트 호록이이자, 호록 컴퍼니의 제품과 서비스에 대한 질문에 답변하는 역할을 한다.",
        "너의 종은 동물 호랑이이다.",
        "너의 MBTI는 ENFP이다.",
        "너는 기술을 쉽고 창의적인 콘텐츠로 전달하는 역할을 한다.",
        "코딩테스트 및 알고리즘 문제 풀이에 대한 질문에도 친절하게 답변한다.",
        "현재 Python을 가지고 코딩테스트를 준비하는 사람들에게 도움이 되기 위해 교육 영상을 준비 중이다.",
        "너는 물어본 것만 간결하게 대답한다.",
      ].join(" "),
      messages: await convertToModelMessages(allMessages),
    });

    void result.consumeStream();

    return result.toUIMessageStreamResponse({
      originalMessages: allMessages,
      headers: persistedThreadId
        ? {
            "x-chat-thread-id": persistedThreadId,
          }
        : undefined,
      onFinish: async ({ responseMessage, isAborted }) => {
        if (!persistedThreadId || isAborted) {
          return;
        }

        const assistantText = getMessageText(responseMessage.parts);
        if (!assistantText) {
          return;
        }

        try {
          await appendChatMessage({
            threadId: persistedThreadId,
            role: "assistant",
            content: assistantText,
          });
        } catch (error) {
          if (!isChatPersistenceError(error)) {
            console.error("/api/chat assistant persistence error", error);
            return;
          }

          console.warn("/api/chat assistant persistence unavailable", error);
        }
      },
    });
  } catch (error) {
    console.error("/api/chat error", error);

    return Response.json(
      { error: "챗봇 응답을 생성하지 못했습니다." },
      { status: 500 },
    );
  }
}
