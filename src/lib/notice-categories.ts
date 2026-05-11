export const NOTICE_TAG_OPTIONS = ["공지", "FAQ", "QnA", "버그 제보"] as const;

export const INQUIRY_TAG_OPTIONS = [
  "계정/로그인",
  "버그/오타 제보",
  "기능/콘텐츠 제안",
  "게시물/댓글 신고",
  "기타",
];

const LEGACY_NOTICE_TAG_ALIASES = {
  중요: "FAQ",
  긴급: "공지",
} as const;

export const ALL_NOTICE_TAG_OPTIONS = [
  ...NOTICE_TAG_OPTIONS,
  ...Object.keys(LEGACY_NOTICE_TAG_ALIASES),
] as const;

export type NoticeTag = (typeof NOTICE_TAG_OPTIONS)[number];

export const NOTICE_SEARCH_TARGET_OPTIONS = [
  "text",
  "author",
  "category",
] as const;

export type NoticeSearchTarget = (typeof NOTICE_SEARCH_TARGET_OPTIONS)[number];

export const NOTICE_SEARCH_PARAM_BY_CATEGORY = {
  공지: "noticeQ",
  FAQ: "faqQ",
  QnA: "qnaQ",
  "버그 제보": "bugQ",
} as const satisfies Record<NoticeTag, string>;

export function normalizeNoticeCategory(
  value?: string | null,
): NoticeTag | null {
  if (!value) {
    return null;
  }

  if (NOTICE_TAG_OPTIONS.includes(value as NoticeTag)) {
    return value as NoticeTag;
  }

  return (
    LEGACY_NOTICE_TAG_ALIASES[
      value as keyof typeof LEGACY_NOTICE_TAG_ALIASES
    ] ?? null
  );
}

export function isNoticeCategoryName(value?: string | null) {
  return normalizeNoticeCategory(value) !== null;
}

export function isPublicNoticeCategory(value?: string | null) {
  const category = normalizeNoticeCategory(value);
  return category === "QnA" || category === "버그 제보";
}

export function parseNoticeCategory(
  value?: string | null,
): NoticeTag | undefined {
  return normalizeNoticeCategory(value) ?? undefined;
}

export function parseNoticeSearchTarget(
  value?: string | null,
): NoticeSearchTarget {
  if (value === "title" || value === "content") {
    return "text";
  }

  return NOTICE_SEARCH_TARGET_OPTIONS.includes(value as NoticeSearchTarget)
    ? (value as NoticeSearchTarget)
    : "text";
}

export function getNoticeCategoryQueryNames(category?: NoticeTag) {
  if (!category) {
    return [...ALL_NOTICE_TAG_OPTIONS];
  }

  if (category === "QnA") {
    return ALL_NOTICE_TAG_OPTIONS.filter((value) => {
      const normalizedCategory = normalizeNoticeCategory(value);
      return normalizedCategory === "QnA" || normalizedCategory === "버그 제보";
    });
  }

  return ALL_NOTICE_TAG_OPTIONS.filter(
    (value) => normalizeNoticeCategory(value) === category,
  );
}
