import type { Prisma } from "@prisma/client";
import {
  comparePostMetrics,
  DEFAULT_SORT,
  type SortType,
} from "@/lib/post-sort";
import { prisma } from "@/lib/prisma";

export type DbUser = {
  id: string;
  email: string;
  password: string | null;
  name: string | null;
  role: "USER" | "ADMIN";
  provider: "credentials" | "github" | "google";
  sns_id: string | null;
};

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
  user_id?: number;
};

export type DbContribution = {
  date: string;
  count: number;
};

function bigintToNumber(value: bigint | number) {
  return typeof value === "bigint" ? Number(value) : value;
}

function parseBigIntId(value?: string) {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  try {
    return BigInt(value);
  } catch {
    return null;
  }
}

function mapUser(user: {
  id: bigint;
  email: string;
  password: string | null;
  name: string | null;
  role: "USER" | "ADMIN";
  provider: "credentials" | "github" | "google";
  snsId: string | null;
}): DbUser {
  return {
    id: user.id.toString(),
    email: user.email,
    password: user.password,
    name: user.name,
    role: user.role,
    provider: user.provider,
    sns_id: user.snsId,
  };
}

function mapPost(post: {
  id: bigint;
  title: string;
  content: string;
  thumbnail: string | null;
  createdAt: Date;
  userId?: bigint;
  user: { name: string | null };
  category: { name: string };
  _count?: { likes?: number; comments?: number };
}): DbPost {
  return {
    id: bigintToNumber(post.id),
    title: post.title,
    content: post.content,
    thumbnail: post.thumbnail,
    created_at: post.createdAt,
    author_name: post.user.name ?? "Unknown",
    category_name: post.category.name,
    likes_count: post._count?.likes ?? 0,
    comments_count: post._count?.comments ?? 0,
    user_id: post.userId ? bigintToNumber(post.userId) : undefined,
  };
}

export async function findUserByEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  return user ? mapUser(user) : null;
}

export async function findUserByName(name: string, excludeUserId?: string) {
  const excludeId = parseBigIntId(excludeUserId);

  const user = await prisma.user.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      ...(excludeId
        ? {
            NOT: {
              id: excludeId,
            },
          }
        : {}),
    },
  });

  return user ? mapUser(user) : null;
}

export async function getUserIdByEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  return user ? bigintToNumber(user.id) : null;
}

export async function createUser(params: {
  email: string;
  passwordHash: string;
  name?: string | null;
  role?: "USER" | "ADMIN";
}) {
  const { email, passwordHash, name = null, role = "USER" } = params;

  const user = await prisma.user.create({
    data: {
      email,
      password: passwordHash,
      name,
      role,
      provider: "credentials",
    },
  });

  return mapUser(user);
}

export async function deleteUserById(userId: string) {
  await prisma.user.delete({
    where: { id: BigInt(userId) },
  });
}

export async function upsertOAuthUser(params: {
  email: string;
  name?: string | null;
  provider: "github" | "google";
  providerId: string;
}) {
  const { email, name = null, provider, providerId } = params;
  const role = email === "th2gr22n@gmail.com" ? "ADMIN" : "USER";

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: name ?? undefined,
      provider,
      snsId: providerId,
    },
    create: {
      email,
      name,
      role,
      provider,
      snsId: providerId,
    },
  });

  return mapUser(user);
}

export async function findPostsPaged(
  limit: number,
  offset: number,
  sort: SortType = DEFAULT_SORT,
): Promise<DbPost[]> {
  const posts = await prisma.post.findMany({
    where: { isDeleted: false },
    include: {
      user: { select: { name: true } },
      category: { select: { name: true } },
      views: { select: { viewCount: true } },
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

  return posts
    .sort((a, b) => {
      return comparePostMetrics(
        sort,
        {
          id: a.id,
          createdAt: a.createdAt,
          likeCount: a._count.likes,
          commentsCount: a._count.comments,
          viewCount: Number(a.views?.viewCount ?? 0),
        },
        {
          id: b.id,
          createdAt: b.createdAt,
          likeCount: b._count.likes,
          commentsCount: b._count.comments,
          viewCount: Number(b.views?.viewCount ?? 0),
        },
      );
    })
    .slice(offset, offset + limit)
    .map(mapPost);
}

export async function findPostById(id: number) {
  const post = await prisma.post.findUnique({
    where: { id: BigInt(id) },
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

  return post ? mapPost(post) : null;
}

async function searchPostsInternal(
  keyword: string,
  limit: number,
  offset: number,
) {
  const where: Prisma.PostWhereInput = {
    isDeleted: false,
    OR: [
      { title: { contains: keyword, mode: "insensitive" } },
      { content: { contains: keyword, mode: "insensitive" } },
    ],
  };

  const posts = await prisma.post.findMany({
    where,
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

export async function findPostsByKeywordPaged(
  keyword: string,
  limit: number,
  offset: number,
) {
  return searchPostsInternal(keyword, limit, offset);
}

export async function findUserContributions(userId: number) {
  const posts = await prisma.post.findMany({
    where: {
      userId: BigInt(userId),
      isDeleted: false,
    },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const counts = new Map<string, number>();

  for (const post of posts) {
    const date = post.createdAt.toISOString().slice(0, 10);
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([date, count]) => ({ date, count }));
}

export async function searchPosts(
  keyword: string,
  limit: number,
  offset: number,
) {
  return searchPostsInternal(keyword, limit, offset);
}
