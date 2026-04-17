import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getUserIdByEmail } from "@/lib/db";
import { getLikeCount, hasLiked } from "@/lib/likes";
import { getPostById } from "@/lib/posts";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const postId = Number(id);

  if (Number.isNaN(postId)) {
    return NextResponse.json({ message: "Invalid post id" }, { status: 400 });
  }

  const post = await getPostById(postId);
  if (!post) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const session = await auth();

  let liked = false;

  if (session?.user?.email) {
    const userId = await getUserIdByEmail(session.user.email);
    if (userId) {
      const post = await getPostById(postId, {
        includeHiddenForUserId: userId,
      });
      if (!post) {
        return NextResponse.json({ message: "Not found" }, { status: 404 });
      }
      liked = await hasLiked(postId, userId);
    }
  } else {
    const post = await getPostById(postId);
    if (!post) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
  }

  const likeCount = await getLikeCount(postId);

  return NextResponse.json({
    liked,
    likeCount,
  });
}
