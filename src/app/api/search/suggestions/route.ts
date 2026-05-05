import { NextResponse } from "next/server";
import { searchPosts } from "@/lib/queries";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  if (!q.trim()) {
    return NextResponse.json([]);
  }

  const rows = await searchPosts(q, 5, 0, "latest", {
    includeNotices: true,
  });
  return NextResponse.json(rows);
}
