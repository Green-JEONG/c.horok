import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import ErrorState from "@/components/common/ErrorState";
import CommentItem from "@/components/posts/CommentItem";
import CommentList from "@/components/posts/CommentList";
import InquiryAnswerComposer from "@/components/posts/InquiryAnswerComposer";
import InquiryStatusButton from "@/components/posts/InquiryStatusButton";
import PostActions from "@/components/posts/PostActions";
import PostContent from "@/components/posts/PostContent";
import PostFooter from "@/components/posts/PostFooter";
import PostViewTracker from "@/components/posts/PostViewTracker";
import { getAdminAnswersByPost } from "@/lib/comments";
import {
  INQUIRY_TAG_OPTIONS,
  isPublicNoticeCategory,
  NOTICE_TAG_OPTIONS,
} from "@/lib/notice-categories";
import { findNoticeAccessMetaById, findNoticeById } from "@/lib/notices";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ from?: string }>;
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

function getSafeNoticeBackHref(from?: string) {
  if (!from) {
    return "/horok-tech/notices";
  }

  return from === "/horok-tech/notices" ||
    from.startsWith("/horok-tech/notices?")
    ? from
    : "/horok-tech/notices";
}

export default async function HorokTechNoticeDetailPage({
  params,
  searchParams,
}: Props) {
  const { slug } = await params;
  const { from } = searchParams ? await searchParams : {};
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
    const accessMeta = await findNoticeAccessMetaById(noticeId);

    if (accessMeta.exists && accessMeta.isSecret) {
      return (
        <ErrorState
          code={403}
          message={
            accessMeta.categoryName === "QnA"
              ? "이 문의 게시물은 작성자와 관리자만 볼 수 있습니다."
              : "이 게시물은 작성자만 볼 수 있습니다."
          }
        />
      );
    }

    notFound();
  }
  const isAdmin = session?.user?.role === "ADMIN";
  const isQnaNotice = notice.categoryName === "QnA";
  const isBugNotice = notice.categoryName === "버그 제보";
  const isFaqNotice = notice.categoryName === "FAQ";
  const isInquiryNotice = isQnaNotice || isBugNotice;

  if (isFaqNotice) {
    redirect(`/horok-tech/notices?category=FAQ&open=${notice.id}`);
  }

  const isOwner = isInquiryNotice
    ? typeof sessionUserId === "number" && notice.userId === sessionUserId
    : isAdmin ||
      (isPublicNoticeCategory(notice.categoryName) &&
        typeof sessionUserId === "number" &&
        notice.userId === sessionUserId);
  const fixedTagOptions = isAdmin
    ? NOTICE_TAG_OPTIONS.filter((option) => option !== "버그 제보")
    : ["QnA"];
  const isUserNoticeMode = isInquiryNotice;
  const backHref = getSafeNoticeBackHref(from);
  const adminAnswers = isInquiryNotice
    ? await getAdminAnswersByPost(notice.id, {
        viewerUserId:
          typeof sessionUserId === "number" && !Number.isNaN(sessionUserId)
            ? sessionUserId
            : null,
        postOwnerUserId: notice.userId,
        isAdmin,
      })
    : [];
  const noticePost = {
    id: notice.id,
    title: notice.title,
    content: notice.content,
    thumbnail: notice.thumbnail,
    created_at: notice.publishedAt,
    updated_at: notice.updatedAt,
    author_name: notice.authorName,
    author_image: notice.authorImage,
    category_name: notice.categoryName,
    view_count: notice.viewCount,
    likes_count: notice.likesCount,
    reactions_count: 0,
    comments_count: notice.commentsCount,
    is_banner: notice.isBanner,
    is_resolved: notice.isResolved,
    is_hidden: notice.isHidden,
    is_secret: notice.isSecret,
    can_view_secret: notice.canViewSecret,
    user_id: notice.userId,
  };
  const inquiryStatus = notice.isResolved
    ? "resolved"
    : notice.hasAdminAnswer
      ? "checking"
      : "waiting";

  return (
    <article className="w-full">
      <PostViewTracker postId={noticeId} />
      <PostActions
        postId={notice.id}
        initialTitle={notice.title}
        initialContent={notice.content}
        initialCategoryName={isBugNotice ? "QnA" : notice.categoryName}
        initialThumbnail={notice.thumbnail}
        initialIsHidden={notice.isHidden}
        initialIsSecret={notice.isSecret}
        initialIsBanner={notice.isBanner}
        isOwner={isOwner}
        redirectPath="/horok-tech/notices"
        categoryLocked
        fixedTagOptions={fixedTagOptions}
        inquiryTagOptions={isUserNoticeMode ? INQUIRY_TAG_OPTIONS : undefined}
        showBannerOption={!isUserNoticeMode}
        allowNoticeBannerForAllCategories={isAdmin}
        headerPost={noticePost}
        headerTitleAddon={
          isInquiryNotice ? (
            <InquiryStatusButton
              postId={notice.id}
              status="resolved"
              initialActive={inquiryStatus === "resolved"}
              canManage={isAdmin}
            />
          ) : null
        }
      >
        <PostContent post={noticePost} />
      </PostActions>
      <PostFooter
        postId={notice.id}
        backHref={backHref}
        showLikeButton
        markCheckingOnAdminReaction={isInquiryNotice && isAdmin}
      />
      {isInquiryNotice ? (
        <section className="mt-10">
          <h3 className="text-lg font-semibold">답변</h3>
          {!notice.canViewSecret ? (
            <p className="mt-4 text-sm text-muted-foreground">
              비밀글은 작성자와 관리자만 답변을 확인할 수 있습니다.
            </p>
          ) : (
            <>
              {adminAnswers.length > 0 ? (
                <ul className="mt-4 space-y-4">
                  {adminAnswers.map((adminAnswer) => (
                    <li key={adminAnswer.id}>
                      <CommentItem
                        comment={{
                          id: adminAnswer.id,
                          user_id: adminAnswer.user_id,
                          parent_id: null,
                          content: adminAnswer.content,
                          is_deleted: false,
                          is_secret: false,
                          can_view_secret: true,
                          is_edited: adminAnswer.is_edited,
                          created_at: adminAnswer.created_at,
                          author: adminAnswer.author,
                          author_image: adminAnswer.author_image,
                          replies: [],
                        }}
                        postId={notice.id}
                        currentUserId={
                          typeof sessionUserId === "number"
                            ? sessionUserId
                            : null
                        }
                        isLoggedIn={Boolean(session?.user?.email)}
                        showReplyButton={false}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  아직 등록된 답변이 없습니다.
                </p>
              )}

              {isAdmin ? (
                <InquiryAnswerComposer
                  postId={notice.id}
                  buttonLabel={
                    adminAnswers.length > 0 ? "추가 답변하기" : "답변하기"
                  }
                />
              ) : null}
            </>
          )}
        </section>
      ) : !isQnaNotice ? (
        <>
          {notice.canViewSecret ? <CommentList postId={notice.id} /> : null}
          {session?.user?.email && notice.canViewSecret ? (
            <InquiryAnswerComposer
              postId={notice.id}
              buttonLabel="댓글 작성하기"
              placeholder="댓글을 작성하세요"
              submitLabel="댓글 등록"
              showSecretOption
            />
          ) : !notice.canViewSecret ? (
            <p className="mt-4 text-sm text-muted-foreground">
              비밀글은 작성자와 관리자만 댓글을 확인할 수 있습니다.
            </p>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              북마크와 댓글 작성은 로그인 후 이용할 수 있습니다.
            </p>
          )}
        </>
      ) : null}
    </article>
  );
}
