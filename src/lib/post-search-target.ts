export const POST_SEARCH_TARGET_OPTIONS = [
  "text",
  "author",
  "category",
] as const;

export type PostSearchTarget = (typeof POST_SEARCH_TARGET_OPTIONS)[number];

export const POST_SEARCH_TARGET_LABEL: Record<PostSearchTarget, string> = {
  text: "제목 및 본문",
  author: "유저명",
  category: "카테고리",
};

export function parsePostSearchTarget(value?: string | null): PostSearchTarget {
  if (value === "title" || value === "content") {
    return "text";
  }

  return POST_SEARCH_TARGET_OPTIONS.includes(value as PostSearchTarget)
    ? (value as PostSearchTarget)
    : "text";
}
