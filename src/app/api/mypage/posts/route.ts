import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getMyPosts } from "@/lib/queries";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json([], { status: 401 });
  }

  const userId = Number(session.user.id);
  const posts = await getMyPosts(userId);

  return NextResponse.json(posts);
}
