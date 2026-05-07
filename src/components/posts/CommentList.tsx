import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getCommentsByPost } from "@/lib/comments";
import CommentItem, { type CommentNode } from "./CommentItem";

export default async function CommentList({
  postId,
  headingLabel = "댓글",
  emptyMessage = "아직 댓글이 없습니다. 첫 댓글을 남겨보세요.",
  replyButtonLabel = "답글 달기",
  replyCloseLabel = "답글 닫기",
  replyPlaceholder = "대댓글을 작성하세요",
  replySubmitLabel = "등록",
}: {
  postId: number;
  headingLabel?: string;
  emptyMessage?: string;
  replyButtonLabel?: string;
  replyCloseLabel?: string;
  replyPlaceholder?: string;
  replySubmitLabel?: string;
}) {
  const session = await auth();
  const isLoggedIn = Boolean(session?.user?.email);
  const currentUserId =
    typeof session?.user?.id === "string" && /^\d+$/.test(session.user.id)
      ? Number(session.user.id)
      : null;
  const comments = await getCommentsByPost(postId, {
    viewerUserId: currentUserId,
    isAdmin: session?.user?.role === "ADMIN",
  });
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
      const topLevelParent = findTopLevelParent(comment, commentMap);
      if (topLevelParent) {
        topLevelParent.replies.push(comment);
        continue;
      }
    }

    rootComments.push(comment);
  }

  return (
    <section className="mt-10">
      <h3 className="mb-6 text-lg font-semibold">
        {headingLabel} {comments.length}
      </h3>

      {rootComments.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="space-y-4">
          {rootComments.map((comment) => (
            <li key={comment.id}>
              <CommentItem
                comment={comment}
                postId={postId}
                currentUserId={currentUserId}
                isLoggedIn={isLoggedIn}
                replyButtonLabel={replyButtonLabel}
                replyCloseLabel={replyCloseLabel}
                replyPlaceholder={replyPlaceholder}
                replySubmitLabel={replySubmitLabel}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function findTopLevelParent(
  comment: CommentNode,
  commentMap: Map<number, CommentNode>,
) {
  let currentParentId = comment.parent_id;
  let topLevelParent: CommentNode | null = null;

  while (currentParentId) {
    const parent = commentMap.get(currentParentId);
    if (!parent) return null;

    topLevelParent = parent;
    currentParentId = parent.parent_id;
  }

  return topLevelParent;
}
