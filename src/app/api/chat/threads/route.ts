import { Prisma } from "@prisma/client";

import { getDbUserIdFromSession } from "@/lib/auth-db";
import { createChatThread } from "@/lib/chat";

function resolveChatPlatform(value: string | null | undefined) {
  return value === "cote" ? "cote" : "tech";
}

function isChatPersistenceError(error: unknown) {
  return (
    (error instanceof Error &&
      error.message === "CHAT_PERSISTENCE_CLIENT_OUTDATED") ||
    (error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2021" || error.code === "P2022"))
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as {
      platform?: string;
    } | null;
    const userId = await getDbUserIdFromSession(
      resolveChatPlatform(body?.platform),
    );
    if (!userId) {
      return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const thread = await createChatThread(userId, "새 대화");

    return Response.json({
      threadId: thread.id,
      title: thread.title ?? "새 대화",
    });
  } catch (error) {
    if (isChatPersistenceError(error)) {
      console.warn("/api/chat/threads POST persistence unavailable", error);

      return Response.json(
        { error: "대화 저장 기능이 아직 준비되지 않았습니다." },
        { status: 503 },
      );
    }

    console.error("/api/chat/threads POST error", error);

    return Response.json(
      { error: "새 대화를 만들지 못했습니다." },
      { status: 500 },
    );
  }
}
