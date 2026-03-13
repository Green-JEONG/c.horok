import Link from "next/link";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getUserIdByEmail } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import LikeButton from "./LikeButton";

type Props = { postId: number };

export default async function PostFooter({ postId }: Props) {
  const [likeCount, session] = await Promise.all([
    prisma.postLike.count({
      where: { postId: BigInt(postId) },
    }),
    auth(),
  ]);

  let liked = false;

  if (session?.user?.email) {
    const userId = await getUserIdByEmail(session.user.email);

    if (userId) {
      const like = await prisma.postLike.findUnique({
        where: {
          postId_userId: {
            postId: BigInt(postId),
            userId: BigInt(userId),
          },
        },
        select: { postId: true },
      });
      liked = Boolean(like);
    }
  }

  return (
    <footer className="mt-6 flex items-center justify-between border-t pt-4">
      <div className="space-y-1">
        <LikeButton
          postId={postId}
          initialLiked={liked}
          initialCount={likeCount}
          disabled={!session?.user?.email}
        />
      </div>

      <Link href="/" className="text-sm text-muted-foreground hover:underline">
        ← 목록으로
      </Link>
    </footer>
  );
}
