import type { Prisma } from "@prisma/client";
import {
  ALL_NOTICE_TAG_OPTIONS,
  isNoticeCategoryName,
} from "@/lib/notice-categories";
import {
  comparePostMetrics,
  DEFAULT_SORT,
  type SortType,
} from "@/lib/post-sort";
import { prisma } from "@/lib/prisma";
import { normalizeSearchText, tokenizeSearchQuery } from "@/lib/search";

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
  is_hidden: boolean;
  is_secret: boolean;
  can_view_secret: boolean;
};

function mapPost(
  post: {
    id: bigint;
    title: string;
    content: string;
    thumbnail: string | null;
    createdAt: Date;
    isHidden: boolean;
    isSecret: boolean;
    userId: bigint;
    user: { name: string | null };
    category: { name: string };
    _count: { likes: number; comments: number };
  },
  options?: {
    viewerUserId?: number | null;
    isAdmin?: boolean;
  },
) {
  const ownerUserId = Number(post.userId);
  const canViewSecret =
    !post.isSecret ||
    Boolean(options?.isAdmin) ||
    (typeof options?.viewerUserId === "number" &&
      ownerUserId === options.viewerUserId);

  return {
    id: Number(post.id),
    title: post.title,
    content: canViewSecret ? post.content : "비밀글입니다.",
    thumbnail: canViewSecret ? post.thumbnail : null,
    created_at: post.createdAt,
    author_name: post.user.name ?? "Unknown",
    category_name: post.category.name,
    likes_count: post._count.likes,
    comments_count: post._count.comments,
    is_hidden: post.isHidden,
    is_secret: post.isSecret,
    can_view_secret: canViewSecret,
  };
}

function buildSearchWhere(
  tokens: string[],
  includeNotices: boolean,
): Prisma.PostWhereInput {
  const baseWhere: Prisma.PostWhereInput = {
    isDeleted: false,
    isHidden: false,
    OR: tokens.flatMap((token) => [
      { title: { contains: token, mode: "insensitive" } },
      { content: { contains: token, mode: "insensitive" } },
      { category: { is: { name: { contains: token, mode: "insensitive" } } } },
    ]),
  };

  if (includeNotices) {
    return baseWhere;
  }

  return {
    ...baseWhere,
    category: {
      is: {
        name: {
          notIn: [...ALL_NOTICE_TAG_OPTIONS],
        },
      },
    },
  };
}

function scoreSearchMatch(
  post: {
    title: string;
    content: string;
    category: { name: string };
  },
  keyword: string,
  tokens: string[],
) {
  const normalizedKeyword = normalizeSearchText(keyword);
  const normalizedTitle = normalizeSearchText(post.title);
  const normalizedContent = normalizeSearchText(post.content);
  const normalizedCategory = normalizeSearchText(post.category.name);

  let score = 0;

  if (normalizedKeyword.length > 0) {
    if (normalizedTitle === normalizedKeyword) score += 120;
    if (normalizedTitle.startsWith(normalizedKeyword)) score += 80;
    if (normalizedTitle.includes(normalizedKeyword)) score += 60;
    if (normalizedCategory.includes(normalizedKeyword)) score += 30;
    if (normalizedContent.includes(normalizedKeyword)) score += 20;
  }

  for (const token of tokens) {
    if (normalizedTitle.startsWith(token)) score += 14;
    else if (normalizedTitle.includes(token)) score += 10;

    if (normalizedCategory.includes(token)) score += 6;
    if (normalizedContent.includes(token)) score += 4;
  }

  return score;
}

export async function searchPosts(
  keyword: string,
  limit: number,
  offset: number,
  sort: SortType = DEFAULT_SORT,
  options?: {
    includeNotices?: boolean;
    viewerUserId?: number | null;
    isAdmin?: boolean;
  },
): Promise<DbPost[]> {
  const tokens = tokenizeSearchQuery(keyword);
  const includeNotices = options?.includeNotices ?? true;

  if (tokens.length === 0) {
    return [];
  }

  const posts = await prisma.post.findMany({
    omit: {
      isResolved: true,
    },
    where: buildSearchWhere(tokens, includeNotices),
    take: Math.max(limit + offset, 48),
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
      const scoreDiff =
        scoreSearchMatch(b, keyword, tokens) -
        scoreSearchMatch(a, keyword, tokens);

      if (scoreDiff !== 0) {
        return scoreDiff;
      }

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
    .map((post) => mapPost(post, options))
    .filter(
      (post) => includeNotices || !isNoticeCategoryName(post.category_name),
    );
}

export async function getPostsByCategorySlug(
  slug: string,
  limit: number,
  offset: number,
  sort: SortType = DEFAULT_SORT,
  options?: {
    viewerUserId?: number | null;
    isAdmin?: boolean;
  },
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
    omit: {
      isResolved: true,
    },
    where: {
      isDeleted: false,
      isHidden: false,
      category: {
        is: { slug },
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
      .map((post) => mapPost(post, options)),
  };
}

export async function getUserPosts(
  userId: number,
  sort: SortType = DEFAULT_SORT,
  limit?: number,
  offset = 0,
  options?: {
    isAdmin?: boolean;
  },
): Promise<DbPost[]> {
  const posts = await prisma.post.findMany({
    omit: {
      isResolved: true,
    },
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
    .map((post) =>
      mapPost(post, { viewerUserId: userId, isAdmin: options?.isAdmin }),
    );
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
  options?: {
    isAdmin?: boolean;
  },
): Promise<DbPost[]> {
  const posts = await prisma.post.findMany({
    omit: {
      isResolved: true,
    },
    where: {
      isDeleted: false,
      isHidden: false,
      category: {
        is: {
          name: {
            notIn: [...ALL_NOTICE_TAG_OPTIONS],
          },
        },
      },
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
    .map((post) =>
      mapPost(post, { viewerUserId: userId, isAdmin: options?.isAdmin }),
    );
}

export async function getRandomPosts(
  limit: number,
  options?: {
    viewerUserId?: number | null;
    isAdmin?: boolean;
  },
): Promise<DbPost[]> {
  const posts = await prisma.post.findMany({
    omit: {
      isResolved: true,
    },
    where: {
      isDeleted: false,
      isHidden: false,
      category: {
        is: {
          name: {
            notIn: [...ALL_NOTICE_TAG_OPTIONS],
          },
        },
      },
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
    .map((post) => mapPost(post, options));
}
