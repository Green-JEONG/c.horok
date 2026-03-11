import CommentForm from "@/components/posts/CommentForm";
import CommentList from "@/components/posts/CommentList";
import PostActions from "@/components/posts/PostActions";
import PostContent from "@/components/posts/PostContent";
import PostFooter from "@/components/posts/PostFooter";
import PostHeader from "@/components/posts/PostHeader";
import PostViewTracker from "@/components/posts/PostViewTracker";
import { getPostById } from "@/lib/posts";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  const postId = Number(id);

  if (Number.isNaN(postId)) {
    return <p>잘못된 접근입니다.</p>;
  }

  const post = await getPostById(postId);
  if (!post) {
    return <p>게시글이 없습니다.</p>;
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <PostViewTracker postId={postId} />
      <PostHeader />
      <PostActions />
      <PostContent />
      <PostFooter postId={postId} />

      {/* 댓글 */}
      <CommentList />
      <CommentForm />
    </article>
  );
}
