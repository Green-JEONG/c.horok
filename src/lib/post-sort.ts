export type SortType = "latest" | "views" | "likes" | "comments";

export const DEFAULT_SORT: SortType = "latest";

export function parseSortType(value?: string | null): SortType {
  if (
    value === "latest" ||
    value === "views" ||
    value === "likes" ||
    value === "comments"
  ) {
    return value;
  }

  return DEFAULT_SORT;
}

export function comparePostMetrics(
  sort: SortType,
  a: {
    createdAt: Date;
    likeCount: number;
    commentsCount: number;
    viewCount: number;
    id: bigint | number;
  },
  b: {
    createdAt: Date;
    likeCount: number;
    commentsCount: number;
    viewCount: number;
    id: bigint | number;
  },
) {
  const latestFirst =
    b.createdAt.getTime() - a.createdAt.getTime() + Number(b.id) - Number(a.id);

  if (sort === "views") {
    return b.viewCount - a.viewCount || latestFirst;
  }

  if (sort === "likes") {
    return b.likeCount - a.likeCount || latestFirst;
  }

  if (sort === "comments") {
    return b.commentsCount - a.commentsCount || latestFirst;
  }

  return latestFirst;
}
