export default function MyCommentsSection() {
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">내가 쓴 댓글</h2>

      <ul className="space-y-3">
        {[1, 2, 3].map((id) => (
          <li key={id} className="rounded-lg border p-4 text-sm hover:bg-muted">
            <p className="line-clamp-2">
              이 게시글 정말 유익하네요! 감사합니다 🙌
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              어떤 글에 달린 댓글
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
