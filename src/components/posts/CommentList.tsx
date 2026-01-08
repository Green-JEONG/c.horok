import CommentItem from "./CommentItem";

export default function CommentList() {
  return (
    <section className="mt-16">
      <h3 className="mb-4 text-lg font-semibold">댓글 3</h3>

      <ul className="space-y-4">
        <CommentItem />
        <CommentItem />
      </ul>

      {/* 최상위 댓글 작성 */}
      <CommentItem />
    </section>
  );
}
