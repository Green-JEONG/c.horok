import { NextResponse } from "next/server";
import { findNotices } from "@/lib/notices";
import { parseSortType } from "@/lib/post-sort";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sort = parseSortType(searchParams.get("sort"));
  const page = Number(searchParams.get("page") ?? "1");

  if (page < 1) {
    return NextResponse.json([], { status: 200 });
  }

  const limit = 12;
  const offset = (page - 1) * limit;
  const notices = await findNotices(sort);

  return NextResponse.json(
    notices.slice(offset, offset + limit).map((notice) => ({
      id: notice.id,
      title: notice.title,
      content: notice.summary,
      thumbnail: null,
      created_at: notice.publishedAt,
      updated_at: notice.publishedAt,
      author_name: "horok-tech",
      category_name: notice.categoryName,
      likes_count: notice.likesCount,
      comments_count: notice.commentsCount,
      view_count: notice.viewCount,
    })),
  );
}
