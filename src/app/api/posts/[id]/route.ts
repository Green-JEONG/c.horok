import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getDbUserIdFromSession } from "@/lib/auth-db";
import {
  isNoticeCategoryName,
  isPublicNoticeCategory,
} from "@/lib/notice-categories";
import {
  deletePost,
  getPostById,
  setPostHidden,
  updatePost,
} from "@/lib/posts";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const postId = Number(id);

  if (Number.isNaN(postId)) {
    return NextResponse.json({ message: "Invalid post id" }, { status: 400 });
  }

  const dbUserId = await getDbUserIdFromSession();
  const session = await auth();
  const post = await getPostById(postId, {
    includeHiddenForUserId: dbUserId,
    includeHiddenForAdmin: session?.user?.role === "ADMIN",
  });
  if (!post) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json(post);
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const postId = Number(id);

  if (Number.isNaN(postId)) {
    return NextResponse.json({ message: "Invalid post id" }, { status: 400 });
  }

  const dbUserId = await getDbUserIdFromSession();
  if (!dbUserId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const session = await auth();

  const post = await getPostById(postId, {
    includeHiddenForUserId: dbUserId,
    includeHiddenForAdmin: session?.user?.role === "ADMIN",
  });
  if (!post) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const postCategory = await prisma.post.findUnique({
    where: { id: BigInt(postId) },
    select: { category: { select: { name: true } } },
  });
  const isNotice = isNoticeCategoryName(postCategory?.category.name);
  const isOwner = isNotice
    ? session?.user?.role === "ADMIN" ||
      (isPublicNoticeCategory(postCategory?.category.name) &&
        post.user_id === dbUserId)
    : post.user_id === dbUserId;

  if (!isOwner) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const {
    title,
    content,
    categoryName,
    thumbnailUrl,
    isBanner,
    isResolved,
    isSecret,
  } = await req.json();

  if (!title || !content) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  if (
    isNoticeCategoryName(categoryName) &&
    session?.user?.role !== "ADMIN" &&
    !isPublicNoticeCategory(categoryName)
  ) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const updated = await updatePost({
    postId,
    title,
    content,
    categoryName,
    isBanner:
      typeof isBanner === "boolean" && isNoticeCategoryName(categoryName)
        ? isBanner
        : false,
    isResolved:
      categoryName === "QnA" && typeof isResolved === "boolean"
        ? isResolved
        : false,
    isSecret: typeof isSecret === "boolean" ? isSecret : undefined,
    thumbnailUrl:
      typeof thumbnailUrl === "string"
        ? thumbnailUrl.trim() || null
        : thumbnailUrl === null
          ? null
          : undefined,
  });

  return NextResponse.json(updated);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const postId = Number(id);

  if (Number.isNaN(postId)) {
    return NextResponse.json({ message: "Invalid post id" }, { status: 400 });
  }

  const dbUserId = await getDbUserIdFromSession();
  if (!dbUserId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const session = await auth();

  const post = await getPostById(postId, {
    includeHiddenForUserId: dbUserId,
    includeHiddenForAdmin: session?.user?.role === "ADMIN",
  });
  if (!post) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const postCategory = await prisma.post.findUnique({
    where: { id: BigInt(postId) },
    select: { category: { select: { name: true } } },
  });
  const isNotice = isNoticeCategoryName(postCategory?.category.name);

  if (
    isNotice
      ? session?.user?.role !== "ADMIN" &&
        (!isPublicNoticeCategory(postCategory?.category.name) ||
          post.user_id !== dbUserId)
      : post.user_id !== dbUserId
  ) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { isHidden } = await req.json();
  if (typeof isHidden !== "boolean") {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  const updated = await setPostHidden({ postId, isHidden });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const postId = Number(id);

  if (Number.isNaN(postId)) {
    return NextResponse.json({ message: "Invalid post id" }, { status: 400 });
  }

  const dbUserId = await getDbUserIdFromSession();
  if (!dbUserId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const session = await auth();

  const post = await getPostById(postId, {
    includeHiddenForUserId: dbUserId,
    includeHiddenForAdmin: session?.user?.role === "ADMIN",
  });
  if (!post) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const postCategory = await prisma.post.findUnique({
    where: { id: BigInt(postId) },
    select: { category: { select: { name: true } } },
  });
  const isNotice = isNoticeCategoryName(postCategory?.category.name);
  const isOwner = isNotice
    ? session?.user?.role === "ADMIN" ||
      (isPublicNoticeCategory(postCategory?.category.name) &&
        post.user_id === dbUserId)
    : post.user_id === dbUserId;

  if (!isOwner) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  await deletePost(postId);

  return NextResponse.json({ ok: true });
}
