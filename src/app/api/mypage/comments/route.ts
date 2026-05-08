import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getUserIdByEmail } from "@/lib/db";
import { isNoticeCategoryName } from "@/lib/notice-categories";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json([]);
  }

  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) {
    return NextResponse.json([]);
  }

  const rows = await prisma.comment.findMany({
    where: {
      userId: BigInt(userId),
      isDeleted: false,
    },
    orderBy: { createdAt: "desc" },
    include: {
      post: {
        select: {
          title: true,
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
    rows.map((comment) => ({
      id: Number(comment.id),
      content: comment.content,
      created_at: comment.createdAt.toISOString(),
      post_id: Number(comment.postId),
      post_title: comment.post.isDeleted
        ? "삭제된 게시물입니다"
        : comment.post.title,
      is_post_deleted: comment.post.isDeleted,
      is_notice_post: isNoticeCategoryName(comment.post.category?.name),
      notice_category_name: comment.post.category?.name ?? null,
    })),
  );
}
