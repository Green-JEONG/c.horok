import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getUserIdByEmail } from "@/lib/db";
import { isPostReactionEmoji } from "@/lib/post-reaction-options";
import {
  getPostReactionSummary,
  togglePostReaction,
} from "@/lib/post-reactions";
import { getPostById } from "@/lib/posts";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const postId = Number(id);

  if (Number.isNaN(postId)) {
    return NextResponse.json({ message: "Invalid post id" }, { status: 400 });
  }

  const session = await auth();
  const userId = session?.user?.email
    ? await getUserIdByEmail(session.user.email)
    : null;
  const post = await getPostById(postId, {
    includeHiddenForUserId: userId,
  });

  if (!post) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const reactions = await getPostReactionSummary(postId, userId);

  return NextResponse.json({ reactions });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const postId = Number(id);

  if (Number.isNaN(postId)) {
    return NextResponse.json({ message: "Invalid post id" }, { status: 400 });
  }

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const post = await getPostById(postId, {
    includeHiddenForUserId: userId,
  });
  if (!post) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const { emoji } = await req.json();
  if (!isPostReactionEmoji(emoji)) {
    return NextResponse.json({ message: "Invalid emoji" }, { status: 400 });
  }

  const result = await togglePostReaction({ postId, userId, emoji });
  const reactions = await getPostReactionSummary(postId, userId);

  return NextResponse.json({ ...result, reactions });
}
