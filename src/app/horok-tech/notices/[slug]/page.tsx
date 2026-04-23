import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import CommentForm from "@/components/posts/CommentForm";
import CommentList from "@/components/posts/CommentList";
import PostActions from "@/components/posts/PostActions";
import PostContent from "@/components/posts/PostContent";
import PostFooter from "@/components/posts/PostFooter";
import PostHeader from "@/components/posts/PostHeader";
import PostViewTracker from "@/components/posts/PostViewTracker";
import { NOTICE_TAG_OPTIONS } from "@/lib/notice-categories";
import { findNoticeById } from "@/lib/notices";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const noticeId = Number(slug);

  if (Number.isNaN(noticeId)) {
    return {
      title: "공지사항 | c.horok",
    };
  }

  const notice = await findNoticeById(noticeId);

  if (!notice) {
    return {
      title: "공지사항 | c.horok",
    };
  }

  return {
    title: `${notice.title} | 공지사항 | c.horok`,
    description: notice.summary,
  };
}

export default async function HorokTechNoticeDetailPage({ params }: Props) {
  const { slug } = await params;
  const noticeId = Number(slug);

  if (Number.isNaN(noticeId)) {
    notFound();
  }

  const session = await auth();
  const sessionUserId =
    typeof session?.user?.id === "string" ? Number(session.user.id) : null;
  const notice = await findNoticeById(noticeId, {
    includeHiddenForUserId:
      typeof sessionUserId === "number" && !Number.isNaN(sessionUserId)
        ? sessionUserId
        : null,
  });

  if (!notice) {
    notFound();
  }
  const isOwner = session?.user?.role === "ADMIN";

  return (
    <article className="mx-auto max-w-3xl">
      <PostViewTracker postId={noticeId} />
      <PostHeader
        post={{
          id: notice.id,
          title: notice.title,
          content: notice.content,
          thumbnail: notice.thumbnail,
          created_at: notice.publishedAt,
          updated_at: notice.updatedAt,
          author_name: notice.authorName,
          category_name: notice.categoryName,
          view_count: notice.viewCount,
          likes_count: notice.likesCount,
          comments_count: notice.commentsCount,
          is_hidden: notice.isHidden,
          user_id: notice.userId,
        }}
      />
      <PostActions
        postId={notice.id}
        initialTitle={notice.title}
        initialContent={notice.content}
        initialCategoryName={notice.categoryName}
        initialThumbnail={notice.thumbnail}
        initialIsHidden={notice.isHidden}
        isOwner={isOwner}
        redirectPath="/horok-tech/notices"
        categoryLocked
        fixedTagOptions={[...NOTICE_TAG_OPTIONS]}
      >
        <PostContent
          post={{
            id: notice.id,
            title: notice.title,
            content: notice.content,
            thumbnail: notice.thumbnail,
            created_at: notice.publishedAt,
            updated_at: notice.updatedAt,
            author_name: notice.authorName,
            category_name: notice.categoryName,
            view_count: notice.viewCount,
            likes_count: notice.likesCount,
            comments_count: notice.commentsCount,
            is_hidden: notice.isHidden,
            user_id: notice.userId,
          }}
        />
      </PostActions>
      <PostFooter postId={notice.id} backHref="/horok-tech/notices" />
      <CommentList postId={notice.id} />
      {session?.user?.email ? (
        <CommentForm postId={notice.id} />
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          좋아요와 댓글 작성은 로그인 후 이용할 수 있습니다.
        </p>
      )}
    </article>
  );
}
