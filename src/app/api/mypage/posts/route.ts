// src/app/api/mypage/posts/route.ts
import { NextResponse } from "next/server";
import { getMyPosts } from "@/lib/queries";
import { requireDbUserId } from "@/lib/auth-db"; // ✅ 이거 사용

export async function GET() {
  try {
    // 항상 DB용 숫자 ID
    const userId = await requireDbUserId();

    const posts = await getMyPosts(userId);

    return NextResponse.json(posts);
  } catch (e) {
    console.error("🔥 MY POSTS API ERROR", e);
    return NextResponse.json([], { status: 500 });
  }
}
