// src/app/api/mypage/posts/route.ts
import { NextResponse } from "next/server";
import { requireDbUserId } from "@/lib/auth-db";
import { parseSortType } from "@/lib/post-sort";
import { getMyPosts } from "@/lib/queries";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const sort = parseSortType(url.searchParams.get("sort"));
    const limit = 12;
    const offset = Math.max(page - 1, 0) * limit;
    const userId = await requireDbUserId();
    const posts = await getMyPosts(userId, sort, limit, offset);

    return NextResponse.json(posts);
  } catch (e) {
    console.error("🔥 MY POSTS API ERROR", e);
    return NextResponse.json([], { status: 500 });
  }
}
