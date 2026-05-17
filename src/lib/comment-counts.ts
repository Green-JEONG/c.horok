import type { Prisma } from "@prisma/client";

export function buildVisibleCommentCountWhere(
  viewerUserId?: number | null,
): Prisma.CommentWhereInput {
  if (typeof viewerUserId === "number" && Number.isInteger(viewerUserId)) {
    return {
      isDeleted: false,
      OR: [{ isHidden: false }, { userId: BigInt(viewerUserId) }],
    };
  }

  return {
    isDeleted: false,
    isHidden: false,
  };
}
