import { deleteUnusedCategories, ensureCategoryByName } from "@/lib/categories";
import { NOTICE_TAG_OPTIONS } from "@/lib/notice-categories";
import { prisma } from "@/lib/prisma";

export type PostRow = {
  id: number;
  user_id: number;
  category_id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_hidden: boolean;
  is_deleted: boolean;
};

export type PopularPostRow = {
  id: number;
  title: string;
  viewCount: number;
};

function mapPost(post: {
  id: bigint;
  userId: bigint;
  categoryId: bigint;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isHidden: boolean;
  isDeleted: boolean;
}) {
  return {
    id: Number(post.id),
    user_id: Number(post.userId),
    category_id: Number(post.categoryId),
    title: post.title,
    content: post.content,
    created_at: post.createdAt.toISOString(),
    updated_at: post.updatedAt.toISOString(),
    is_hidden: post.isHidden,
    is_deleted: post.isDeleted,
  };
}

export async function getPostById(
  id: number,
  options?: {
    includeHiddenForUserId?: number | null;
    includeHiddenForAdmin?: boolean;
  },
) {
  const post = await prisma.post.findFirst({
    where: {
      id: BigInt(id),
      isDeleted: false,
      OR: [
        { isHidden: false },
        ...(options?.includeHiddenForAdmin ? [{}] : []),
        ...(options?.includeHiddenForUserId
          ? [{ userId: BigInt(options.includeHiddenForUserId) }]
          : []),
      ],
    },
  });

  return post ? mapPost(post) : null;
}

export async function incrementPostViews(postId: number) {
  await prisma.postView.upsert({
    where: { postId: BigInt(postId) },
    update: {
      viewCount: {
        increment: 1,
      },
    },
    create: {
      postId: BigInt(postId),
      viewCount: 1,
    },
  });
}

export async function getPopularPosts(limit = 5): Promise<PopularPostRow[]> {
  const posts = await prisma.post.findMany({
    where: {
      isDeleted: false,
      isHidden: false,
      category: {
        is: {
          name: {
            notIn: [...NOTICE_TAG_OPTIONS],
          },
        },
      },
    },
    include: {
      views: {
        select: { viewCount: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return posts
    .map((post) => ({
      id: Number(post.id),
      title: post.title,
      viewCount: Number(post.views?.viewCount ?? 0),
    }))
    .sort((a, b) => b.viewCount - a.viewCount || b.id - a.id)
    .slice(0, limit);
}

export async function createPost(params: {
  userId: number;
  categoryName: string;
  title: string;
  content: string;
  thumbnailUrl?: string | null;
}) {
  const { userId, categoryName, title, content, thumbnailUrl = null } = params;
  const category = await ensureCategoryByName(categoryName);

  const post = await prisma.post.create({
    data: {
      userId: BigInt(userId),
      categoryId: BigInt(category.id),
      title,
      content,
      thumbnail: thumbnailUrl,
    },
  });

  return mapPost(post);
}

export async function setPostHidden(params: {
  postId: number;
  isHidden: boolean;
}) {
  const post = await prisma.post.update({
    where: { id: BigInt(params.postId) },
    data: {
      isHidden: params.isHidden,
      hiddenAt: params.isHidden ? new Date() : null,
    },
  });

  return mapPost(post);
}

export async function updatePost(params: {
  postId: number;
  categoryName?: string;
  title: string;
  content: string;
  thumbnailUrl?: string | null;
}) {
  const { postId, categoryName, title, content, thumbnailUrl } = params;
  const category = categoryName
    ? await ensureCategoryByName(categoryName)
    : null;

  const post = await prisma.post.update({
    where: { id: BigInt(postId) },
    data: {
      title,
      content,
      ...(category ? { categoryId: BigInt(category.id) } : {}),
      ...(thumbnailUrl !== undefined ? { thumbnail: thumbnailUrl } : {}),
    },
  });

  return mapPost(post);
}

export async function deletePost(postId: number) {
  const post = await prisma.post.update({
    where: { id: BigInt(postId) },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
    select: {
      categoryId: true,
    },
  });

  const activeCount = await prisma.post.count({
    where: {
      categoryId: post.categoryId,
      isDeleted: false,
      isHidden: false,
    },
  });

  if (activeCount === 0) {
    await deleteUnusedCategories();
  }
}
