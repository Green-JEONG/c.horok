import { NextResponse } from "next/server";
import { parseSortType } from "@/lib/post-sort";
import { searchPosts } from "@/lib/queries";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("q") ?? "";
  if (!raw.trim()) return NextResponse.json([]);

  const page = Number(searchParams.get("page") ?? 1);
  const sort = parseSortType(searchParams.get("sort"));
  const limit = 12;
  const offset = (page - 1) * limit;

  const rows = await searchPosts(raw, limit, offset, sort, {
    includeNotices: true,
  });

  return NextResponse.json(rows);
}
