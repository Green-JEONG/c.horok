import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { parseSortType } from "@/lib/post-sort";
import { searchPosts } from "@/lib/queries";

export async function GET(req: Request) {
  const session = await auth();
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("q") ?? "";
  if (!raw.trim()) return NextResponse.json([]);

  const page = Number(searchParams.get("page") ?? 1);
  const sort = parseSortType(searchParams.get("sort"));
  const limit = 12;
  const offset = (page - 1) * limit;

  const rows = await searchPosts(raw, limit, offset, sort, {
    includeNotices: true,
    viewerUserId:
      typeof session?.user?.id === "string" ? Number(session.user.id) : null,
    isAdmin: session?.user?.role === "ADMIN",
  });

  return NextResponse.json(rows);
}
