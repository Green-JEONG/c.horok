import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getCommentsByPost } from "@/lib/comments";
import CommentItem, { type CommentNode } from "./CommentItem";

export default async function CommentList({ postId }: { postId: number }) {
  const comments = await getCommentsByPost(postId);
  const session = await auth();
  const currentUserId =
    typeof session?.user?.id === "string" && /^\d+$/.test(session.user.id)
      ? Number(session.user.id)
      : null;
  const isAdmin = session?.user?.role === "ADMIN";
  const commentMap = new Map<number, CommentNode>();
  const rootComments: CommentNode[] = [];

  for (const comment of comments) {
    commentMap.set(comment.id, {
      ...comment,
      replies: [],
    });
  }

  for (const comment of commentMap.values()) {
    if (comment.parent_id) {
      const parent = commentMap.get(comment.parent_id);
      if (parent) {
        parent.replies.push(comment);
        continue;
      }
    }

    rootComments.push(comment);
  }

  return (
    <section className="mt-16">
      <h3 className="mb-4 text-lg font-semibold">댓글 {comments.length}</h3>

      {rootComments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          아직 댓글이 없습니다. 첫 댓글을 남겨보세요.
        </p>
      ) : (
        <ul className="space-y-4">
          {rootComments.map((comment) => (
            <li key={comment.id}>
              <CommentItem
                comment={comment}
                postId={postId}
                currentUserId={currentUserId}
                isAdmin={Boolean(isAdmin)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
