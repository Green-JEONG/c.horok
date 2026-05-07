import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { findPostsPaged, getUserIdByEmail } from "@/lib/db";
import {
  isNoticeCategoryName,
  isPublicNoticeCategory,
} from "@/lib/notice-categories";
import { parseSortType } from "@/lib/post-sort";
import { createPost } from "@/lib/posts";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const sort = parseSortType(url.searchParams.get("sort"));
  const limit = 12;
  const offset = Math.max(page - 1, 0) * limit;
  const session = await auth();
  const viewerUserId =
    typeof session?.user?.id === "string" ? Number(session.user.id) : null;

  const posts = await findPostsPaged(limit, offset, sort, {
    viewerUserId:
      typeof viewerUserId === "number" && !Number.isNaN(viewerUserId)
        ? viewerUserId
        : null,
    isAdmin: session?.user?.role === "ADMIN",
  });

  return NextResponse.json(posts);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // DB용 userId 조회 (핵심)
  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const body = await req.json();
  const {
    categoryName,
    title,
    content,
    thumbnailUrl,
    isBanner,
    isResolved,
    isSecret,
  } = body;

  if (!categoryName || !title || !content) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  if (
    isNoticeCategoryName(categoryName) &&
    session.user.role !== "ADMIN" &&
    !isPublicNoticeCategory(categoryName)
  ) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const post = await createPost({
    userId,
    categoryName,
    title,
    content,
    isBanner: Boolean(isBanner) && isNoticeCategoryName(categoryName),
    isResolved:
      categoryName === "QnA" && typeof isResolved === "boolean"
        ? isResolved
        : false,
    isSecret: Boolean(isSecret),
    thumbnailUrl:
      typeof thumbnailUrl === "string" && thumbnailUrl.trim()
        ? thumbnailUrl.trim()
        : null,
  });

  return NextResponse.json(post, { status: 201 });
}
