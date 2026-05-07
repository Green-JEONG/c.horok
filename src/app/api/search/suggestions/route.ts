import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { searchPosts } from "@/lib/queries";

export async function GET(req: Request) {
  const session = await auth();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  if (!q.trim()) {
    return NextResponse.json([]);
  }

  const rows = await searchPosts(q, 5, 0, "latest", {
    includeNotices: true,
    viewerUserId:
      typeof session?.user?.id === "string" ? Number(session.user.id) : null,
    isAdmin: session?.user?.role === "ADMIN",
  });
  return NextResponse.json(rows);
}
