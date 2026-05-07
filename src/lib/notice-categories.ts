export const NOTICE_TAG_OPTIONS = ["공지", "FAQ", "QnA"] as const;

const LEGACY_NOTICE_TAG_ALIASES = {
  중요: "FAQ",
  긴급: "공지",
} as const;

export const ALL_NOTICE_TAG_OPTIONS = [
  ...NOTICE_TAG_OPTIONS,
  ...Object.keys(LEGACY_NOTICE_TAG_ALIASES),
] as const;

export type NoticeTag = (typeof NOTICE_TAG_OPTIONS)[number];

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
  return normalizeNoticeCategory(value) === "QnA";
}

export function parseNoticeCategory(
  value?: string | null,
): NoticeTag | undefined {
  return normalizeNoticeCategory(value) ?? undefined;
}

export function getNoticeCategoryQueryNames(category?: NoticeTag) {
  if (!category) {
    return [...ALL_NOTICE_TAG_OPTIONS];
  }

  return ALL_NOTICE_TAG_OPTIONS.filter(
    (value) => normalizeNoticeCategory(value) === category,
  );
}
