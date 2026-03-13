import { prisma } from "@/lib/prisma";

export type DbPost = {
  id: number;
  title: string;
  content: string;
  thumbnail: string | null;
  created_at: Date;
  author_name: string;
  category_name: string;
  likes_count: number;
  comments_count: number;
};

function mapPost(post: {
  id: bigint;
  title: string;
  content: string;
  thumbnail: string | null;
  createdAt: Date;
  user: { name: string | null };
  category: { name: string };
  _count: { likes: number; comments: number };
}) {
  return {
    id: Number(post.id),
    title: post.title,
    content: post.content,
    thumbnail: post.thumbnail,
    created_at: post.createdAt,
    author_name: post.user.name ?? "Unknown",
    category_name: post.category.name,
    likes_count: post._count.likes,
    comments_count: post._count.comments,
  };
}

export async function searchPosts(
  keyword: string,
  limit: number,
  offset: number,
): Promise<DbPost[]> {
  const posts = await prisma.post.findMany({
    where: {
      isDeleted: false,
      OR: [
        { title: { contains: keyword, mode: "insensitive" } },
        { content: { contains: keyword, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    skip: offset,
    take: limit,
    include: {
      user: { select: { name: true } },
      category: { select: { name: true } },
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

  return posts.map(mapPost);
}

export async function getMyPosts(userId: number): Promise<DbPost[]> {
  const posts = await prisma.post.findMany({
    where: {
      userId: BigInt(userId),
      isDeleted: false,
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true } },
      category: { select: { name: true } },
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

  return posts.map(mapPost);
}

export async function getLikedPosts(userId: number): Promise<DbPost[]> {
  const posts = await prisma.post.findMany({
    where: {
      isDeleted: false,
      likes: {
        some: {
          userId: BigInt(userId),
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: { select: { name: true } },
      category: { select: { name: true } },
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

  return posts.map(mapPost);
}
