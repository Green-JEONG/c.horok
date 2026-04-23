import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getUserIdByEmail } from "@/lib/db";
import { isNoticeCategoryName } from "@/lib/notice-categories";
import { prisma } from "@/lib/prisma";
import { getTechFeedPostPath } from "@/lib/routes";

function normalizeNotificationType(type: string | null) {
  if (type === "NEW_COMMENT") return "POST_COMMENT";
  if (type === "NEW_LIKE") return "POST_LIKE";
  return type ?? "UNKNOWN";
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json([], { status: 401 });
    }

    const userId = await getUserIdByEmail(session.user.email);
    if (!userId) {
      return NextResponse.json([], { status: 404 });
    }

    const rows = await prisma.notification.findMany({
      where: { userId: BigInt(userId) },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        actor: {
          select: { name: true },
        },
        post: {
          select: {
            id: true,
            isDeleted: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      rows.map((row) => ({
        id: Number(row.id),
        type: normalizeNotificationType(row.type),
        message: row.content ?? null,
        actor_name: row.actor?.name ?? null,
        post_id: row.postId ? Number(row.postId) : null,
        comment_id: row.commentId ? Number(row.commentId) : null,
        post_path: row.postId
          ? isNoticeCategoryName(row.post?.category?.name)
            ? `/horok-tech/notices/${Number(row.postId)}`
            : getTechFeedPostPath(Number(row.postId))
          : null,
        is_post_deleted: row.post?.isDeleted ?? false,
        is_read: row.isRead ? 1 : 0,
        created_at: row.createdAt.toISOString(),
      })),
    );
  } catch (e) {
    console.error("🔔 NOTIFICATIONS API ERROR", e);
    return NextResponse.json([], { status: 500 });
  }
}
