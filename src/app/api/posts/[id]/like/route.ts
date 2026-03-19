import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getUserIdByEmail } from "@/lib/db";
import { toggleLike } from "@/lib/likes";
import { getPostById } from "@/lib/posts";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const postId = Number(id);

  if (Number.isNaN(postId)) {
    return NextResponse.json({ message: "Invalid post id" }, { status: 400 });
  }

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // 🔑 email → DB userId(BIGINT)
  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const post = await getPostById(postId);
  if (!post) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const result = await toggleLike({ postId, userId });

  if (result.liked) {
    try {
      if (post && post.user_id !== userId) {
        await prisma.notification.create({
          data: {
            userId: BigInt(post.user_id),
            actorId: BigInt(userId),
            type: "POST_LIKE",
            content: "내 게시물에 좋아요가 눌렸어요",
            postId: BigInt(postId),
          },
        });
      }
    } catch (error) {
      console.error("🔔 좋아요 알림 생성 실패", error);
    }
  }

  return NextResponse.json(result);
}
