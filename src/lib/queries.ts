import {
  comparePostMetrics,
  DEFAULT_SORT,
  type SortType,
} from "@/lib/post-sort";
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
  sort: SortType = DEFAULT_SORT,
): Promise<DbPost[]> {
  const posts = await prisma.post.findMany({
    where: {
      isDeleted: false,
      OR: [
        { title: { contains: keyword, mode: "insensitive" } },
        { content: { contains: keyword, mode: "insensitive" } },
      ],
    },
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

export async function getPostsByCategorySlug(
  slug: string,
  limit: number,
  offset: number,
  sort: SortType = DEFAULT_SORT,
): Promise<{ categoryName: string | null; posts: DbPost[] }> {
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { name: true },
  });

  if (!category) {
    return {
      categoryName: null,
      posts: [],
    };
  }

  const posts = await prisma.post.findMany({
    where: {
      isDeleted: false,
      category: {
        slug,
      },
    },
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

  return {
    categoryName: category.name,
    posts: posts
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
      .map(mapPost),
  };
}

export async function getUserPosts(
  userId: number,
  sort: SortType = DEFAULT_SORT,
  limit?: number,
  offset = 0,
): Promise<DbPost[]> {
  const posts = await prisma.post.findMany({
    where: {
      userId: BigInt(userId),
      isDeleted: false,
    },
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
    .slice(offset, limit ? offset + limit : undefined)
    .map(mapPost);
}

export async function getMyPosts(
  userId: number,
  sort: SortType = DEFAULT_SORT,
  limit?: number,
  offset = 0,
): Promise<DbPost[]> {
  return getUserPosts(userId, sort, limit, offset);
}

export async function getLikedPosts(
  userId: number,
  sort: SortType = DEFAULT_SORT,
  limit?: number,
  offset = 0,
): Promise<DbPost[]> {
  const posts = await prisma.post.findMany({
    where: {
      isDeleted: false,
      likes: {
        some: {
          userId: BigInt(userId),
        },
      },
    },
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
    .slice(offset, limit ? offset + limit : undefined)
    .map(mapPost);
}

export async function getRandomPosts(limit: number): Promise<DbPost[]> {
  const posts = await prisma.post.findMany({
    where: {
      isDeleted: false,
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

  return posts
    .sort(() => Math.random() - 0.5)
    .slice(0, limit)
    .map(mapPost);
}
