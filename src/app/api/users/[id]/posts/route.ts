import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { parseSortType } from "@/lib/post-sort";
import { getUserPosts } from "@/lib/queries";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!/^\d+$/.test(id)) {
    return NextResponse.json([], { status: 400 });
  }

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const sort = parseSortType(url.searchParams.get("sort"));
  const query = url.searchParams.get("q") ?? undefined;
  const categorySlug = url.searchParams.get("category") ?? undefined;

  if (page < 1) {
    return NextResponse.json([], { status: 200 });
  }

  const limit = 12;
  const offset = (page - 1) * limit;
  const session = await auth();
  const viewerUserId =
    typeof session?.user?.id === "string" ? Number(session.user.id) : null;
  const posts = await getUserPosts(Number(id), sort, limit, offset, {
    viewerUserId:
      typeof viewerUserId === "number" && !Number.isNaN(viewerUserId)
        ? viewerUserId
        : null,
    isAdmin: session?.user?.role === "ADMIN",
    query,
    categorySlug,
  });

  return NextResponse.json(posts);
}
