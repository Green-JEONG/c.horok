import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { parsePostSearchTarget } from "@/lib/post-search-target";
import { searchPosts, searchUsersByName } from "@/lib/queries";

export async function GET(req: Request) {
  const session = await auth();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const searchTarget = parsePostSearchTarget(searchParams.get("searchTarget"));

  if (!q.trim()) {
    return NextResponse.json({ users: [], posts: [] });
  }

  const [users, posts] = await Promise.all([
    searchTarget === "author"
      ? searchUsersByName(
          q,
          3,
          "nameAsc",
          typeof session?.user?.id === "string"
            ? Number(session.user.id)
            : null,
        )
      : [],
    searchPosts(q, 3, 0, "latest", {
      includeNotices: true,
      viewerUserId:
        typeof session?.user?.id === "string" ? Number(session.user.id) : null,
      isAdmin: session?.user?.role === "ADMIN",
      searchTarget,
    }),
  ]);

  return NextResponse.json({
    users,
    posts,
  });
}
