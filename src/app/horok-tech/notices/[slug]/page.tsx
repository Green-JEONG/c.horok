import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import CommentForm from "@/components/posts/CommentForm";
import CommentList from "@/components/posts/CommentList";
import PostActions from "@/components/posts/PostActions";
import PostContent from "@/components/posts/PostContent";
import PostFooter from "@/components/posts/PostFooter";
import PostViewTracker from "@/components/posts/PostViewTracker";
import {
  isPublicNoticeCategory,
  NOTICE_TAG_OPTIONS,
} from "@/lib/notice-categories";
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

  const session = await auth();
  const sessionUserId =
    typeof session?.user?.id === "string" ? Number(session.user.id) : null;
  const notice = await findNoticeById(noticeId, {
    includeHiddenForUserId:
      typeof sessionUserId === "number" && !Number.isNaN(sessionUserId)
        ? sessionUserId
        : null,
    isAdmin: session?.user?.role === "ADMIN",
  });

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
    isAdmin: session?.user?.role === "ADMIN",
  });

  if (!notice) {
    notFound();
  }
  const isOwner =
    session?.user?.role === "ADMIN" ||
    (isPublicNoticeCategory(notice.categoryName) &&
      typeof sessionUserId === "number" &&
      notice.userId === sessionUserId);
  const fixedTagOptions =
    session?.user?.role === "ADMIN" ? [...NOTICE_TAG_OPTIONS] : ["QnA"];
  const isUserQnaMode =
    session?.user?.role !== "ADMIN" &&
    isPublicNoticeCategory(notice.categoryName);
  const noticePost = {
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
    is_banner: notice.isBanner,
    is_resolved: notice.isResolved,
    is_hidden: notice.isHidden,
    is_secret: notice.isSecret,
    can_view_secret: notice.canViewSecret,
    user_id: notice.userId,
  };

  return (
    <article className="mx-auto max-w-3xl">
      <PostViewTracker postId={noticeId} />
      <PostActions
        postId={notice.id}
        initialTitle={notice.title}
        initialContent={notice.content}
        initialCategoryName={notice.categoryName}
        initialThumbnail={notice.thumbnail}
        initialIsHidden={notice.isHidden}
        initialIsSecret={notice.isSecret}
        initialIsBanner={notice.isBanner}
        initialIsResolved={notice.isResolved}
        isOwner={isOwner}
        redirectPath="/horok-tech/notices"
        categoryLocked
        fixedTagOptions={fixedTagOptions}
        showThumbnailTab={!isUserQnaMode}
        showBannerOption={!isUserQnaMode}
        headerPost={noticePost}
      >
        <PostContent post={noticePost} />
      </PostActions>
      <PostFooter postId={notice.id} backHref="/horok-tech/notices" />
      {notice.canViewSecret ? <CommentList postId={notice.id} /> : null}
      {session?.user?.email && notice.canViewSecret ? (
        <CommentForm postId={notice.id} />
      ) : !notice.canViewSecret ? (
        <p className="mt-4 text-sm text-muted-foreground">
          비밀글은 작성자와 관리자만 댓글을 확인할 수 있습니다.
        </p>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          좋아요와 댓글 작성은 로그인 후 이용할 수 있습니다.
        </p>
      )}
    </article>
  );
}
