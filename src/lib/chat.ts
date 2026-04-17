import type { UIMessage } from "ai";

import { prisma } from "@/lib/prisma";

type ChatRole = "user" | "assistant";
type ChatThreadDelegate = typeof prisma.chatThread;
type ChatMessageDelegate = typeof prisma.chatMessage;

export type ChatThreadSummary = {
  id: string;
  title: string;
  preview: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
};

function getChatThreadDelegate() {
  const delegate = (prisma as typeof prisma & { chatThread?: unknown })
    .chatThread;

  if (!delegate) {
    throw new Error("CHAT_PERSISTENCE_CLIENT_OUTDATED");
  }

  return delegate as ChatThreadDelegate;
}

function getChatMessageDelegate() {
  const delegate = (prisma as typeof prisma & { chatMessage?: unknown })
    .chatMessage;

  if (!delegate) {
    throw new Error("CHAT_PERSISTENCE_CLIENT_OUTDATED");
  }

  return delegate as ChatMessageDelegate;
}

function toPreviewText(text: string) {
  return text.replace(/\s+/g, " ").trim().slice(0, 80);
}

function getThreadDisplayTitle(title: string | null, preview: string) {
  if (title?.trim()) {
    return title.trim();
  }

  return preview || "새 대화";
}

function formatChatMessage(message: {
  id: bigint;
  role: ChatRole;
  content: string;
}): UIMessage {
  return {
    id: message.id.toString(),
    role: message.role,
    parts: [
      {
        type: "text",
        text: message.content,
      },
    ],
  };
}

export async function createChatThread(userId: number, title?: string | null) {
  const thread = await getChatThreadDelegate().create({
    data: {
      userId: BigInt(userId),
      title: title ?? null,
    },
    select: {
      id: true,
      title: true,
    },
  });

  return {
    id: thread.id.toString(),
    title: thread.title,
  };
}

export async function getLatestChatThreadByUserId(userId: number) {
  const thread = await getChatThreadDelegate().findFirst({
    where: {
      userId: BigInt(userId),
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
    },
  });

  if (!thread) {
    return null;
  }

  return {
    id: thread.id.toString(),
    title: thread.title,
  };
}

export async function getChatThreadById(userId: number, threadId: string) {
  const thread = await getChatThreadDelegate().findFirst({
    where: {
      id: BigInt(threadId),
      userId: BigInt(userId),
    },
    select: {
      id: true,
      title: true,
    },
  });

  if (!thread) {
    return null;
  }

  return {
    id: thread.id.toString(),
    title: thread.title,
  };
}

export async function listChatThreadsByUserId(userId: number) {
  const threads = await getChatThreadDelegate().findMany({
    where: {
      userId: BigInt(userId),
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      messages: {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 1,
        select: {
          content: true,
        },
      },
      _count: {
        select: {
          messages: true,
        },
      },
    },
  });

  return threads.map((thread): ChatThreadSummary => {
    const preview = toPreviewText(thread.messages[0]?.content ?? "");

    return {
      id: thread.id.toString(),
      title: getThreadDisplayTitle(thread.title, preview),
      preview,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
      messageCount: thread._count.messages,
    };
  });
}

export async function updateChatThreadTitle(
  threadId: string,
  title?: string | null,
) {
  await getChatThreadDelegate().update({
    where: { id: BigInt(threadId) },
    data: { title: title ?? null },
  });
}

export async function getChatMessages(threadId: string) {
  const messages = await getChatMessageDelegate().findMany({
    where: { threadId: BigInt(threadId) },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      role: true,
      content: true,
    },
  });

  return messages.map(formatChatMessage);
}

export async function appendChatMessage(params: {
  threadId: string;
  role: ChatRole;
  content: string;
}) {
  const chatMessage = getChatMessageDelegate();
  const chatThread = getChatThreadDelegate();

  await prisma.$transaction([
    chatMessage.create({
      data: {
        threadId: BigInt(params.threadId),
        role: params.role,
        content: params.content,
      },
    }),
    chatThread.update({
      where: { id: BigInt(params.threadId) },
      data: {
        updatedAt: new Date(),
      },
    }),
  ]);
}
