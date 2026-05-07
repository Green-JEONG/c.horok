import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { parseSortType } from "@/lib/post-sort";
import { getPostsByCategorySlug } from "@/lib/queries";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth();
  const { slug } = await params;
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const limit = Number(url.searchParams.get("limit") ?? "12");
  const sort = parseSortType(url.searchParams.get("sort"));

  if (Number.isNaN(page) || Number.isNaN(limit) || page < 1 || limit < 1) {
    return NextResponse.json(
      { message: "Invalid pagination params" },
      { status: 400 },
    );
  }

  const offset = (page - 1) * limit;
  const { categoryName, posts } = await getPostsByCategorySlug(
    slug,
    limit,
    offset,
    sort,
    {
      viewerUserId:
        typeof session?.user?.id === "string" ? Number(session.user.id) : null,
      isAdmin: session?.user?.role === "ADMIN",
    },
  );

  if (!categoryName) {
    return NextResponse.json(
      { message: "Category not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    category: {
      name: categoryName,
      slug,
    },
    pagination: {
      page,
      limit,
    },
    posts,
  });
}
