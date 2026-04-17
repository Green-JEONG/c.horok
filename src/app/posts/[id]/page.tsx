import { notFound } from "next/navigation";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import CommentForm from "@/components/posts/CommentForm";
import CommentList from "@/components/posts/CommentList";
import PostActions from "@/components/posts/PostActions";
import PostContent from "@/components/posts/PostContent";
import PostFooter from "@/components/posts/PostFooter";
import PostHeader from "@/components/posts/PostHeader";
import PostViewTracker from "@/components/posts/PostViewTracker";
import { getDbUserIdFromSession } from "@/lib/auth-db";
import { findPostById } from "@/lib/db";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  const postId = Number(id);

  if (Number.isNaN(postId)) {
    notFound();
  }

  const dbUserId = await getDbUserIdFromSession();
  const post = await findPostById(postId, {
    includeHiddenForUserId: dbUserId,
  });
  if (!post) {
    notFound();
  }

  const session = await auth();
  const isOwner =
    typeof session?.user?.id === "string" &&
    Number(session.user.id) === post.user_id;

  return (
    <article className="mx-auto max-w-3xl">
      <PostViewTracker postId={postId} />
      <PostHeader post={post} />
      <PostActions
        postId={postId}
        initialTitle={post.title}
        initialContent={post.content}
        initialCategoryName={post.category_name}
        initialThumbnail={post.thumbnail}
        initialIsHidden={post.is_hidden}
        isOwner={isOwner}
      />
      <PostContent post={post} />
      <PostFooter postId={postId} />

      {/* 댓글 */}
      <CommentList postId={postId} />
      {session?.user?.email ? (
        <CommentForm postId={postId} />
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          좋아요와 댓글 작성은 로그인 후 이용할 수 있습니다.
        </p>
      )}
    </article>
  );
}
