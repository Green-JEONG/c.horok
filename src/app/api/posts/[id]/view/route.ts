import { NextResponse } from "next/server";
import { getPostById, incrementPostViews } from "@/lib/posts";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const postId = Number(id);

  if (Number.isNaN(postId)) {
    return NextResponse.json({ message: "Invalid post id" }, { status: 400 });
  }

  const post = await getPostById(postId);
  if (!post) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  await incrementPostViews(postId);

  return NextResponse.json({ ok: true });
}
