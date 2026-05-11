// src/app/api/mypage/posts/route.ts
import { NextResponse } from "next/server";
import { requireDbUserId } from "@/lib/auth-db";
import { parsePostSearchTarget } from "@/lib/post-search-target";
import { parseSortType } from "@/lib/post-sort";
import { countUserPosts, getMyPosts } from "@/lib/queries";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const requestedPage = Number(url.searchParams.get("page") ?? "1");
    const sort = parseSortType(url.searchParams.get("sort"));
    const requestedLimit = Number(url.searchParams.get("limit") ?? "15");
    const requestedOffset = Number(url.searchParams.get("offset") ?? "");
    const targetPostId = Number(url.searchParams.get("targetPostId") ?? "");
    const categorySlug = url.searchParams.get("category") ?? undefined;
    const query = url.searchParams.get("q") ?? undefined;
    const searchTarget = parsePostSearchTarget(
      url.searchParams.get("searchTarget"),
    );
    const limit =
      Number.isFinite(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, 15)
        : 15;
    const requestedOffsetValue =
      Number.isFinite(requestedOffset) && requestedOffset >= 0
        ? requestedOffset
        : null;
    const userId = await requireDbUserId();
    const totalCount = await countUserPosts(userId, {
      viewerUserId: userId,
      categorySlug,
      query,
      searchTarget,
    });

    let resolvedPage = Math.max(requestedPage, 1);
    let posts = [] as Awaited<ReturnType<typeof getMyPosts>>;

    if (Number.isFinite(targetPostId) && targetPostId > 0) {
      const allPosts = await getMyPosts(userId, sort, undefined, 0, {
        categorySlug,
        query,
        searchTarget,
      });
      const targetIndex = allPosts.findIndex(
        (post) => post.id === targetPostId,
      );

      if (targetIndex >= 0) {
        resolvedPage = Math.floor(targetIndex / limit) + 1;
      }

      const offset =
        requestedOffsetValue ?? Math.max(resolvedPage - 1, 0) * limit;
      posts = allPosts.slice(offset, offset + limit);
    } else {
      const offset =
        requestedOffsetValue ?? Math.max(resolvedPage - 1, 0) * limit;
      resolvedPage = Math.floor(offset / limit) + 1;
      posts = await getMyPosts(userId, sort, limit, offset, {
        categorySlug,
        query,
        searchTarget,
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
