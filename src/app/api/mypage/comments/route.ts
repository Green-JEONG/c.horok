import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getUserIdByEmail } from "@/lib/db";
import { isNoticeCategoryName } from "@/lib/notice-categories";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ comments: [], totalCount: 0, resolvedPage: 1 });
  }

  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) {
    return NextResponse.json({ comments: [], totalCount: 0, resolvedPage: 1 });
  }
  const url = new URL(request.url);
  const requestedPage = Number(url.searchParams.get("page") ?? "1");
  const requestedLimit = Number(url.searchParams.get("limit") ?? "5");
  const query = url.searchParams.get("q")?.trim();
  const sort = url.searchParams.get("sort") === "oldest" ? "asc" : "desc";
  const limit =
    Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 30)
      : 5;
  const resolvedPage =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const where = {
    userId: BigInt(userId),
    isDeleted: false,
    ...(query
      ? {
          OR: [
            { content: { contains: query } },
            { post: { title: { contains: query } } },
          ],
        }
      : {}),
  };

  const [totalCount, rows] = await Promise.all([
    prisma.comment.count({ where }),
    prisma.comment.findMany({
      where,
      orderBy: { createdAt: sort },
      skip: (resolvedPage - 1) * limit,
      take: limit,
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
    }),
  ]);

  return NextResponse.json({
    comments: rows.map((comment) => ({
      id: Number(comment.id),
      content: comment.content,
      created_at: comment.createdAt.toISOString(),
      post_id: Number(comment.postId),
      post_title: comment.post.isDeleted
        ? "삭제된 게시물입니다."
        : comment.post.title,
      is_post_deleted: comment.post.isDeleted,
      is_notice_post: isNoticeCategoryName(comment.post.category?.name),
      notice_category_name: comment.post.category?.name ?? null,
    })),
    totalCount,
    resolvedPage,
  });
}
