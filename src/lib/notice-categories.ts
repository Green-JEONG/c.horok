export const NOTICE_TAG_OPTIONS = ["공지", "중요", "긴급"] as const;

export type NoticeTag = (typeof NOTICE_TAG_OPTIONS)[number];

export function isNoticeCategoryName(
  value?: string | null,
): value is NoticeTag {
  if (!value) {
    return false;
  }

  return NOTICE_TAG_OPTIONS.includes(value as NoticeTag);
}
