export default function PostActions() {
  const isOwner = true;

  if (!isOwner) return null;

  return (
    <div className="mb-6 flex justify-end gap-2 text-sm">
      <button
        type="button"
        className="rounded-md border px-3 py-1 hover:bg-muted"
      >
        수정
      </button>

      <button
        type="button"
        className="rounded-md border px-3 py-1 text-red-500 hover:bg-red-50"
      >
        삭제
      </button>
    </div>
  );
}
