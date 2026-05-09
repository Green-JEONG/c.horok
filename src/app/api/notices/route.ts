import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import {
  parseNoticeCategory,
  parseNoticeSearchTarget,
} from "@/lib/notice-categories";
import { findNotices } from "@/lib/notices";
import { parseSortType } from "@/lib/post-sort";

export async function GET(req: Request) {
  const session = await auth();
  const { searchParams } = new URL(req.url);
  const sort = parseSortType(searchParams.get("sort"));
  const category = parseNoticeCategory(searchParams.get("category"));
  const queryParamName =
    category === "FAQ" ? "faqQ" : category === "QnA" ? "qnaQ" : "noticeQ";
  const query = searchParams.get(queryParamName) ?? searchParams.get("q");
  const searchTarget = parseNoticeSearchTarget(
    searchParams.get("noticeSearchTarget"),
  );
  const page = Number(searchParams.get("page") ?? "1");

  if (page < 1) {
    return NextResponse.json([], { status: 200 });
  }

  const limit = 10;
  const offset = (page - 1) * limit;
  const sessionUserId =
    typeof session?.user?.id === "string" ? Number(session.user.id) : null;
  const validSessionUserId =
    typeof sessionUserId === "number" && !Number.isNaN(sessionUserId)
      ? sessionUserId
      : null;
  const notices = await findNotices(sort, category, {
    viewerUserId: validSessionUserId,
    isAdmin: session?.user?.role === "ADMIN",
    query,
    searchTarget,
  });

  return NextResponse.json(notices.slice(offset, offset + limit));
}
