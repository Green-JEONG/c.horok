import { prisma } from "@/lib/prisma";

export type CommentRow = {
  id: number;
  post_id: number;
  user_id: number;
  parent_id: number | null;
  content: string;
  is_deleted: boolean;
  is_secret: boolean;
  can_view_secret: boolean;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
};

function mapComment(
  comment: {
    id: bigint;
    postId: bigint;
    userId: bigint;
    parentId: bigint | null;
    content: string;
    isDeleted: boolean;
    isSecret: boolean;
    createdAt: Date;
    updatedAt: Date;
  },
  options?: {
    viewerUserId?: number | null;
    postOwnerUserId?: number | null;
    isAdmin?: boolean;
  },
) {
  const commentUserId = Number(comment.userId);
  const canViewSecret =
    !comment.isSecret ||
    Boolean(options?.isAdmin) ||
    commentUserId === options?.viewerUserId ||
    options?.postOwnerUserId === options?.viewerUserId;

  return {
    id: Number(comment.id),
    post_id: Number(comment.postId),
    user_id: commentUserId,
    parent_id: comment.parentId ? Number(comment.parentId) : null,
    content: canViewSecret ? comment.content : "비밀댓글입니다.",
    is_deleted: comment.isDeleted,
    is_secret: comment.isSecret,
    can_view_secret: canViewSecret,
    is_edited: comment.updatedAt.getTime() > comment.createdAt.getTime(),
    created_at: comment.createdAt.toISOString(),
    updated_at: comment.updatedAt.toISOString(),
  };
}

export async function getCommentsByPost(
  postId: number,
  options?: {
    viewerUserId?: number | null;
    isAdmin?: boolean;
  },
) {
  const comments = await prisma.comment.findMany({
    where: {
      postId: BigInt(postId),
    },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: { email: true, name: true },
      },
      post: {
        select: { userId: true },
      },
    },
  });

  return comments.map((comment) => ({
    ...mapComment(comment, {
      viewerUserId: options?.viewerUserId ?? null,
      isAdmin: options?.isAdmin,
      postOwnerUserId: Number(comment.post.userId),
    }),
    author:
      comment.isSecret &&
      !(
        options?.isAdmin ||
        Number(comment.userId) === options?.viewerUserId ||
        Number(comment.post.userId) === options?.viewerUserId
      )
        ? "비공개"
        : (comment.user.name ?? comment.user.email),
  }));
}

export async function getCommentById(id: number) {
  const comment = await prisma.comment.findUnique({
    where: { id: BigInt(id) },
  });

  return comment ? mapComment(comment) : null;
}

export async function createComment(params: {
  postId: number;
  userId: number;
  content: string;
  parentId?: number | null;
  isSecret?: boolean;
}) {
  const { postId, userId, content, parentId = null, isSecret = false } = params;

  const comment = await prisma.comment.create({
    data: {
      postId: BigInt(postId),
      userId: BigInt(userId),
      content,
      parentId: parentId ? BigInt(parentId) : null,
      isSecret,
    },
  });

  return Number(comment.id);
}

export async function updateComment(params: {
  commentId: number;
  content: string;
  isSecret?: boolean;
}) {
  const { commentId, content, isSecret } = params;

  const comment = await prisma.comment.update({
    where: { id: BigInt(commentId) },
    data: {
      content,
      ...(isSecret !== undefined ? { isSecret } : {}),
    },
  });

  return mapComment(comment);
}

export async function softDeleteComment(commentId: number) {
  await prisma.comment.update({
    where: { id: BigInt(commentId) },
    data: { isDeleted: true },
  });
}
