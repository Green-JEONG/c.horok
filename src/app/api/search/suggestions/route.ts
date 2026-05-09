import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { parseGlobalPostSearchTarget } from "@/lib/post-search-target";
import {
  countSearchPostsByPreviewGroup,
  countUsersByName,
  searchPosts,
  searchUsersByName,
} from "@/lib/queries";

export async function GET(req: Request) {
  const session = await auth();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const searchTarget = parseGlobalPostSearchTarget(
    searchParams.get("searchTarget"),
  );

  if (!q.trim()) {
    return NextResponse.json({
      users: [],
      posts: [],
      userCount: 0,
      postCount: 0,
      postCounts: {
        posts: 0,
        notice: 0,
        faq: 0,
        qna: 0,
      },
      totalCount: 0,
    });
  }

  const [users, posts, userCount, postCounts] = await Promise.all([
    searchTarget === "all" || searchTarget === "author"
      ? searchUsersByName(
          q,
          3,
          "nameAsc",
          typeof session?.user?.id === "string"
            ? Number(session.user.id)
            : null,
        )
      : [],
    searchPosts(q, 12, 0, "latest", {
      includeNotices: true,
      viewerUserId:
        typeof session?.user?.id === "string" ? Number(session.user.id) : null,
      isAdmin: session?.user?.role === "ADMIN",
      searchTarget,
    }),
    searchTarget === "all" || searchTarget === "author"
      ? countUsersByName(q)
      : 0,
    countSearchPostsByPreviewGroup(q, {
      searchTarget,
    }),
  ]);
  const postCount =
    postCounts.posts + postCounts.notice + postCounts.faq + postCounts.qna;

  return NextResponse.json({
    users,
    posts,
    userCount,
    postCount,
    postCounts,
    totalCount: userCount + postCount,
  });
}
