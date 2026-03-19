import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getUserIdByEmail } from "@/lib/db";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json([]);
  }

  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) {
    return NextResponse.json([]);
  }

  const rows = await prisma.comment.findMany({
    where: {
      userId: BigInt(userId),
      isDeleted: false,
    },
    orderBy: { createdAt: "desc" },
    include: {
      post: {
        select: { title: true },
      },
    },
  });

  return NextResponse.json(
    rows.map((comment) => ({
      id: Number(comment.id),
      content: comment.content,
      post_id: Number(comment.postId),
      post_title: comment.post.title,
    })),
  );
}
