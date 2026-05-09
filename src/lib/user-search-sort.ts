export const USER_SEARCH_SORT_OPTIONS = [
  "nameAsc",
  "nameDesc",
  "followers",
  "posts",
] as const;

export type UserSearchSort = (typeof USER_SEARCH_SORT_OPTIONS)[number];

export const USER_SEARCH_SORT_LABEL: Record<UserSearchSort, string> = {
  nameAsc: "오름차순",
  nameDesc: "내림차순",
  followers: "구독자수",
  posts: "글작성 수",
};

export function parseUserSearchSort(value?: string | null): UserSearchSort {
  return USER_SEARCH_SORT_OPTIONS.includes(value as UserSearchSort)
    ? (value as UserSearchSort)
    : "nameAsc";
}
