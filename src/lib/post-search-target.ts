export const POST_SEARCH_TARGET_OPTIONS = [
  "text",
  "author",
  "category",
] as const;

export type SelectablePostSearchTarget =
  (typeof POST_SEARCH_TARGET_OPTIONS)[number];
export type PostSearchTarget = "all" | SelectablePostSearchTarget;

export const POST_SEARCH_TARGET_LABEL: Record<PostSearchTarget, string> = {
  all: "전체",
  text: "제목 및 본문",
  author: "유저명",
  category: "카테고리",
};

export function parsePostSearchTarget(value?: string | null): PostSearchTarget {
  if (value === "title" || value === "content") {
    return "text";
  }

  return POST_SEARCH_TARGET_OPTIONS.includes(
    value as SelectablePostSearchTarget,
  )
    ? (value as SelectablePostSearchTarget)
    : "text";
}

export function parseGlobalPostSearchTarget(
  value?: string | null,
): PostSearchTarget {
  if (!value || value === "all") {
    return "all";
  }

  return parsePostSearchTarget(value);
}
