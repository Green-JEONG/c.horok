// src/app/api/mypage/posts/route.ts
import { NextResponse } from "next/server";
import { requireDbUserId } from "@/lib/auth-db";
import { parseSortType } from "@/lib/post-sort";
import { countUserPosts, getMyPosts } from "@/lib/queries";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const requestedPage = Number(url.searchParams.get("page") ?? "1");
    const sort = parseSortType(url.searchParams.get("sort"));
    const requestedLimit = Number(url.searchParams.get("limit") ?? "12");
    const targetPostId = Number(url.searchParams.get("targetPostId") ?? "");
    const categorySlug = url.searchParams.get("category") ?? undefined;
    const limit =
      Number.isFinite(requestedLimit) && requestedLimit > 0
        ? requestedLimit
        : 12;
    const userId = await requireDbUserId();
    const totalCount = await countUserPosts(userId, {
      viewerUserId: userId,
      categorySlug,
    });

    let resolvedPage = Math.max(requestedPage, 1);
    let posts = [] as Awaited<ReturnType<typeof getMyPosts>>;

    if (Number.isFinite(targetPostId) && targetPostId > 0) {
      const allPosts = await getMyPosts(userId, sort, undefined, 0, {
        categorySlug,
      });
      const targetIndex = allPosts.findIndex(
        (post) => post.id === targetPostId,
      );

      if (targetIndex >= 0) {
        resolvedPage = Math.floor(targetIndex / limit) + 1;
      }

      const offset = Math.max(resolvedPage - 1, 0) * limit;
      posts = allPosts.slice(offset, offset + limit);
    } else {
      const offset = Math.max(resolvedPage - 1, 0) * limit;
      posts = await getMyPosts(userId, sort, limit, offset, {
        categorySlug,
      });
    }

    return NextResponse.json({
      posts,
      totalCount,
      resolvedPage,
    });
  } catch (e) {
    console.error("🔥 MY POSTS API ERROR", e);
    return NextResponse.json(
      { posts: [], totalCount: 0, resolvedPage: 1 },
      { status: 500 },
    );
  }
}
