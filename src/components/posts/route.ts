import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { findPostsPaged } from "@/lib/db";
import { parseSortType } from "@/lib/post-sort";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") ?? 1);
  const sort = parseSortType(searchParams.get("sort"));

  if (page < 1) {
    return NextResponse.json([], { status: 200 });
  }

  const limit = 12;
  const offset = (page - 1) * limit;
  const session = await auth();
  const viewerUserId =
    typeof session?.user?.id === "string" ? Number(session.user.id) : null;

  const posts = await findPostsPaged(limit, offset, sort, {
    viewerUserId:
      typeof viewerUserId === "number" && !Number.isNaN(viewerUserId)
        ? viewerUserId
        : null,
    isAdmin: session?.user?.role === "ADMIN",
  });
  return NextResponse.json(posts);
}
