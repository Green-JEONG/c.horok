import { List } from "lucide-react";
import Link from "next/link";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getUserIdByEmail } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import LikeButton from "./LikeButton";

type Props = {
  postId: number;
  backHref?: string;
};

export default async function PostFooter({
  postId,
  backHref = "/horok-tech/feeds",
}: Props) {
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
    <footer className="flex items-center justify-between border-t pt-4">
      <div className="space-y-1">
        <LikeButton
          postId={postId}
          initialLiked={liked}
          initialCount={likeCount}
          disabled={!session?.user?.email}
        />
      </div>

      <Link
        href={backHref}
        aria-label="목록으로"
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        <List className="h-5 w-5" />
      </Link>
    </footer>
  );
}
