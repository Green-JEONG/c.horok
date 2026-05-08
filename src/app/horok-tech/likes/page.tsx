import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import LikedPostList from "@/components/posts/LikedPostList";
import PostListHeader from "@/components/posts/PostListHeader";
import { getUserIdByEmail } from "@/lib/db";
import { countLikedPosts } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Like | c.horok",
  description: "좋아요 페이지",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "/horok-tech/likes",
  },
};

export default async function HorokTechLikesPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const session = await auth();
  const { sort } = await searchParams;
  const userId = session?.user?.email
    ? await getUserIdByEmail(session.user.email)
    : null;
  const likedCount = userId ? await countLikedPosts(userId) : 0;

  return (
    <div className="space-y-4">
      <Suspense
        fallback={<div className="h-6 w-32 rounded bg-muted animate-pulse" />}
      >
        <PostListHeader
          titleAction={
            <span className="text-sm font-medium text-muted-foreground">
              {likedCount}
            </span>
          }
        />
      </Suspense>

      <LikedPostList sort={sort} />
    </div>
  );
}
