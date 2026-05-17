import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { buildVisibleCommentCountWhere } from "@/lib/comment-counts";
import { getUserIdByEmail } from "@/lib/db";
import { getPostReactionCountsByPostId } from "@/lib/post-reactions";
import { parsePostSearchTarget } from "@/lib/post-search-target";
import { parseSortType } from "@/lib/post-sort";
import { prisma } from "@/lib/prisma";

const ALLOWED_CATEGORIES = new Set(["공지", "FAQ"]);

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN" || !session.user.email) {
      return NextResponse.json({ posts: [], totalCount: 0, resolvedPage: 1 });
    }

    const userId = await getUserIdByEmail(session.user.email);
    if (!userId) {
      return NextResponse.json({ posts: [], totalCount: 0, resolvedPage: 1 });
    }

    const url = new URL(request.url);
    const category = url.searchParams.get("category") ?? "공지";
    const requestedPage = Number(url.searchParams.get("page") ?? "1");
    const requestedLimit = Number(url.searchParams.get("limit") ?? "12");
    const targetPostId = Number(url.searchParams.get("targetPostId") ?? "");
    const sort = parseSortType(url.searchParams.get("sort"));
    const query = url.searchParams.get("q")?.trim();
    const searchTarget = parsePostSearchTarget(
      url.searchParams.get("searchTarget"),
    );
    const limit =
      Number.isFinite(requestedLimit) && requestedLimit > 0
        ? requestedLimit
        : 12;

    if (!ALLOWED_CATEGORIES.has(category)) {
      return NextResponse.json({ posts: [], totalCount: 0, resolvedPage: 1 });
    }

    const searchWhere: Prisma.PostWhereInput = query
      ? searchTarget === "category"
        ? {
            category: {
              is: {
                name: { contains: query, mode: "insensitive" },
              },
            },
          }
        : {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { content: { contains: query, mode: "insensitive" } },
            ],
          }
      : {};
    const where: Prisma.PostWhereInput = {
      userId: BigInt(userId),
      isDeleted: false,
      category: { is: { name: category } },
      ...(query ? { AND: [searchWhere] } : {}),
    };
    const totalCount = await prisma.post.count({ where });
    const rows = await prisma.post.findMany({
      omit: { isResolved: true },
      where,
      include: {
        user: { select: { name: true, image: true } },
        category: { select: { name: true } },
        views: { select: { viewCount: true } },
        _count: {
          select: {
            likes: true,
            comments: { where: buildVisibleCommentCountWhere(userId) },
          },
        },
      },
    });
    const sortedRows = rows.sort((a, b) => {
      const latestFirst =
        b.createdAt.getTime() -
        a.createdAt.getTime() +
        Number(b.id) -
        Number(a.id);
      const oldestFirst =
        a.createdAt.getTime() -
        b.createdAt.getTime() +
        Number(a.id) -
        Number(b.id);

      if (sort === "oldest") {
        return oldestFirst;
      }

      if (sort === "views") {
        return (
          Number(b.views?.viewCount ?? 0) - Number(a.views?.viewCount ?? 0) ||
          latestFirst
        );
      }

      if (sort === "likes") {
        return b._count.likes - a._count.likes || latestFirst;
      }

      if (sort === "comments") {
        return b._count.comments - a._count.comments || latestFirst;
      }

      return latestFirst;
    });
    let resolvedPage = Math.max(requestedPage, 1);

    if (Number.isFinite(targetPostId) && targetPostId > 0) {
      const targetIndex = sortedRows.findIndex(
        (post) => Number(post.id) === targetPostId,
      );

      if (targetIndex >= 0) {
        resolvedPage = Math.floor(targetIndex / limit) + 1;
      }
    }

    const offset = Math.max(resolvedPage - 1, 0) * limit;
    const pagedRows = sortedRows.slice(offset, offset + limit);
    const reactionCounts = await getPostReactionCountsByPostId(
      pagedRows.map((post) => post.id),
    );
    const posts = pagedRows.map((post) => ({
      id: Number(post.id),
      title: post.title,
      content: post.content,
      thumbnail: post.thumbnail,
      created_at: post.createdAt,
      author_name: post.user.name ?? "Unknown",
      author_image: post.user.image ?? null,
      category_name: post.category?.name ?? "",
      view_count: Number(post.views?.viewCount ?? 0),
      likes_count: post._count.likes,
      reactions_count: reactionCounts.get(Number(post.id)) ?? 0,
      comments_count: post._count.comments,
      is_hidden: post.isHidden,
      is_secret: post.isSecret,
      can_view_secret: true,
    }));

    return NextResponse.json({ posts, totalCount, resolvedPage });
  } catch (error) {
    console.error("MY ADMIN POSTS API ERROR", error);
    return NextResponse.json(
      { posts: [], totalCount: 0, resolvedPage: 1 },
      { status: 500 },
    );
  }
}
