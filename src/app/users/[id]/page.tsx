import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContributionGrid from "@/components/contributions/ContributionGrid";
import MyPostList from "@/components/posts/MyPostList";
import PostListHeader from "@/components/posts/PostListHeader";
import { findUserById } from "@/lib/db";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    return {
      title: "유저 페이지 | c.horok",
    };
  }

  const user = await findUserById(id);

  return {
    title: `${user?.name ?? "유저"} | c.horok`,
    description: `${user?.name ?? "유저"}의 잔디와 작성한 글`,
  };
}

export default async function UserPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { sort } = await searchParams;

  if (!/^\d+$/.test(id)) {
    notFound();
  }

  const user = await findUserById(id);

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <ContributionGrid userId={Number(id)} />
      <PostListHeader title="작성한 글" showWriteButton={false} />
      <MyPostList
        sort={sort}
        userId={Number(id)}
        emptyMessage="아직 작성한 게시글이 없습니다."
      />
    </div>
  );
}
