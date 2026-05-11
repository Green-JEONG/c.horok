import { List } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getUserIdByEmail } from "@/lib/db";
import { getPostReactionSummary } from "@/lib/post-reactions";
import { prisma } from "@/lib/prisma";
import LikeButton from "./LikeButton";
import PostReactionButton from "./PostReactionButton";

type Props = {
  postId: number;
  backHref?: string;
  showLikeButton?: boolean;
  likeActionSlot?: ReactNode;
  markCheckingOnAdminReaction?: boolean;
};

export default async function PostFooter({
  postId,
  backHref = "/horok-tech/feeds",
  showLikeButton = true,
  likeActionSlot,
  markCheckingOnAdminReaction = false,
}: Props) {
  const [likeCount, session] = await Promise.all([
    prisma.postLike.count({
      where: { postId: BigInt(postId) },
    }),
    auth(),
  ]);

  let liked = false;
  let userId: number | null = null;

  if (session?.user?.email) {
    userId = await getUserIdByEmail(session.user.email);

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
  const reactions = await getPostReactionSummary(postId, userId);

  return (
    <footer
      className={`flex items-center border-t pt-4 ${
        showLikeButton ? "justify-between" : "justify-end"
      }`}
    >
      {showLikeButton ? (
        <div className="flex items-center gap-2">
          <LikeButton
            postId={postId}
            initialLiked={liked}
            initialCount={likeCount}
            disabled={!session?.user?.email}
          />
          {likeActionSlot}
          <PostReactionButton
            postId={postId}
            initialReactions={reactions}
            disabled={!session?.user?.email}
            markCheckingOnAdminReaction={markCheckingOnAdminReaction}
          />
        </div>
      ) : null}

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
