import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getUserIdByEmail } from "@/lib/db";
import { parsePostSearchTarget } from "@/lib/post-search-target";
import { parseSortType } from "@/lib/post-sort";
import { getLikedPosts } from "@/lib/queries";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json([], { status: 401 });
  }

  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) {
    return NextResponse.json([], { status: 404 });
  }

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const sort = parseSortType(url.searchParams.get("sort"));
  const query = url.searchParams.get("q") ?? undefined;
  const searchTarget = parsePostSearchTarget(
    url.searchParams.get("searchTarget"),
  );
  const limit = 12;
  const offset = Math.max(page - 1, 0) * limit;

  const posts = await getLikedPosts(userId, sort, limit, offset, {
    isAdmin: session.user.role === "ADMIN",
    query,
    searchTarget,
  });

  return NextResponse.json(posts);
}
