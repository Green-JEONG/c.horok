import { prisma } from "@/lib/prisma";

export type CommentRow = {
  id: number;
  post_id: number;
  user_id: number;
  parent_id: number | null;
  content: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
};

function mapComment(comment: {
  id: bigint;
  postId: bigint;
  userId: bigint;
  parentId: bigint | null;
  content: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: Number(comment.id),
    post_id: Number(comment.postId),
    user_id: Number(comment.userId),
    parent_id: comment.parentId ? Number(comment.parentId) : null,
    content: comment.content,
    is_deleted: comment.isDeleted,
    created_at: comment.createdAt.toISOString(),
    updated_at: comment.updatedAt.toISOString(),
  };
}

export async function getCommentsByPost(postId: number) {
  const comments = await prisma.comment.findMany({
    where: {
      postId: BigInt(postId),
      isDeleted: false,
    },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: { email: true, name: true },
      },
    },
  });

  return comments.map((comment) => ({
    ...mapComment(comment),
    author: comment.user.name ?? comment.user.email,
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
}) {
  const { postId, userId, content, parentId = null } = params;

  const comment = await prisma.comment.create({
    data: {
      postId: BigInt(postId),
      userId: BigInt(userId),
      content,
      parentId: parentId ? BigInt(parentId) : null,
    },
  });

  return Number(comment.id);
}

export async function updateComment(params: {
  commentId: number;
  content: string;
}) {
  const { commentId, content } = params;

  const comment = await prisma.comment.update({
    where: { id: BigInt(commentId) },
    data: { content },
  });

  return mapComment(comment);
}

export async function softDeleteComment(commentId: number) {
  await prisma.comment.update({
    where: { id: BigInt(commentId) },
    data: { isDeleted: true },
  });
}
