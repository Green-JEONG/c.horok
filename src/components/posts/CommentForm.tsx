export default function CommentForm({
  placeholder = "댓글을 작성하세요",
}: {
  placeholder?: string;
}) {
  return (
    <form className="mt-6 space-y-2">
      <textarea
        className="w-full rounded-md border p-3 text-sm"
        rows={3}
        placeholder={placeholder}
      />

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-1.5 text-sm text-white"
        >
          등록
        </button>
      </div>
    </form>
  );
}
