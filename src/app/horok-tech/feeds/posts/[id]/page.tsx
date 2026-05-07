import { notFound } from "next/navigation";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import CommentForm from "@/components/posts/CommentForm";
import CommentList from "@/components/posts/CommentList";
import PostActions from "@/components/posts/PostActions";
import PostContent from "@/components/posts/PostContent";
import PostFooter from "@/components/posts/PostFooter";
import PostViewTracker from "@/components/posts/PostViewTracker";
import { getDbUserIdFromSession } from "@/lib/auth-db";
import { findPostById } from "@/lib/db";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function HorokTechPostPage({ params }: Props) {
  const { id } = await params;
  const postId = Number(id);

  if (Number.isNaN(postId)) {
    notFound();
  }

  const dbUserId = await getDbUserIdFromSession();
  const session = await auth();
  const post = await findPostById(postId, {
    includeHiddenForUserId: dbUserId,
    includeHiddenForAdmin: session?.user?.role === "ADMIN",
  });
  if (!post) {
    notFound();
  }

  const isOwner =
    typeof session?.user?.id === "string" &&
    Number(session.user.id) === post.user_id;

  return (
    <article className="mx-auto max-w-3xl">
      <PostViewTracker postId={postId} />
      <PostActions
        postId={postId}
        initialTitle={post.title}
        initialContent={post.content}
        initialCategoryName={post.category_name}
        initialThumbnail={post.thumbnail}
        initialIsHidden={post.is_hidden}
        initialIsSecret={post.is_secret}
        isOwner={isOwner}
        headerPost={post}
      >
        <PostContent post={post} />
      </PostActions>
      <PostFooter postId={postId} />

      {post.can_view_secret ? <CommentList postId={postId} /> : null}
      {session?.user?.email && post.can_view_secret ? (
        <CommentForm postId={postId} />
      ) : !post.can_view_secret ? (
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
