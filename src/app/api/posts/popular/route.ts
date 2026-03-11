import { NextResponse } from "next/server";
import { getPopularPosts } from "@/lib/posts";

export async function GET() {
  const rows = await getPopularPosts();

  return NextResponse.json(rows);
}
