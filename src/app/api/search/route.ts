import { NextResponse } from "next/server";
import { parseSortType } from "@/lib/post-sort";
import { searchPosts } from "@/lib/queries";
import { normalizeQuery } from "@/lib/search";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("q") ?? "";

  const q = await normalizeQuery(raw);
  if (!q) return NextResponse.json([]);

  const page = Number(searchParams.get("page") ?? 1);
  const sort = parseSortType(searchParams.get("sort"));
  const limit = 12;
  const offset = (page - 1) * limit;

  const rows = await searchPosts(q, limit, offset, sort);

  return NextResponse.json(rows);
}
