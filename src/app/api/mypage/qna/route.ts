import { NextResponse } from "next/server";
import { requireDbUserId } from "@/lib/auth-db";
import { parsePostSearchTarget } from "@/lib/post-search-target";
import { parseSortType } from "@/lib/post-sort";
import { countMyQnaPosts, getMyQnaPosts } from "@/lib/queries";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const requestedPage = Number(url.searchParams.get("page") ?? "1");
    const sort = parseSortType(url.searchParams.get("sort"));
    const requestedLimit = Number(url.searchParams.get("limit") ?? "12");
    const targetPostId = Number(url.searchParams.get("targetPostId") ?? "");
    const query = url.searchParams.get("q") ?? undefined;
    const searchTarget = parsePostSearchTarget(
      url.searchParams.get("searchTarget"),
    );
    const limit =
      Number.isFinite(requestedLimit) && requestedLimit > 0
        ? requestedLimit
        : 12;
    const userId = await requireDbUserId();
    const totalCount = await countMyQnaPosts(userId, {
      query,
      searchTarget,
    });

    let resolvedPage = Math.max(requestedPage, 1);
    let posts = [] as Awaited<ReturnType<typeof getMyQnaPosts>>;

    if (Number.isFinite(targetPostId) && targetPostId > 0) {
      const allPosts = await getMyQnaPosts(userId, sort, undefined, 0, {
        query,
        searchTarget,
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
      posts = await getMyQnaPosts(userId, sort, limit, offset, {
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
    console.error("MY QNA API ERROR", e);
    return NextResponse.json(
      { posts: [], totalCount: 0, resolvedPage: 1 },
      { status: 500 },
    );
  }
}
