import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.category.findMany({
    where: {
      posts: {
        some: {
          isDeleted: false,
        },
      },
    },
    include: {
      _count: {
        select: {
          posts: {
            where: { isDeleted: false },
          },
        },
      },
    },
  });

  return NextResponse.json(
    rows
      .map((category) => ({
        id: Number(category.id),
        name: category.name,
        slug: category.slug,
        postCount: category._count.posts,
      }))
      .filter((category) => category.postCount > 0)
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, 10),
  );
}
