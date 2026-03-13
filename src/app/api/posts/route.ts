import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getUserIdByEmail } from "@/lib/db";
import { createPost } from "@/lib/posts";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.post.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { name: true } },
      user: { select: { email: true, name: true } },
      _count: {
        select: {
          likes: true,
          comments: {
            where: { isDeleted: false },
          },
        },
      },
    },
  });

  return NextResponse.json(
    rows.map((post) => ({
      id: Number(post.id),
      title: post.title,
      content: post.content,
      thumbnail: post.thumbnail,
      created_at: post.createdAt.toISOString(),
      category_name: post.category.name,
      author_name: post.user.name ?? post.user.email,
      likes_count: post._count.likes,
      comments_count: post._count.comments,
    })),
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // DB용 userId 조회 (핵심)
  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const body = await req.json();
  const { categoryName, title, content, thumbnailUrl } = body;

  if (!categoryName || !title || !content) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  const post = await createPost({
    userId,
    categoryName,
    title,
    content,
    thumbnailUrl:
      typeof thumbnailUrl === "string" && thumbnailUrl.trim()
        ? thumbnailUrl.trim()
        : null,
  });

  return NextResponse.json(post, { status: 201 });
}
