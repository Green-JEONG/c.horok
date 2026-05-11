export type SortType =
  | "latest"
  | "oldest"
  | "views"
  | "likes"
  | "comments"
  | "category"
  | "categoryDesc";

export const DEFAULT_SORT: SortType = "latest";

export function parseSortType(value?: string | null): SortType {
  if (
    value === "latest" ||
    value === "oldest" ||
    value === "views" ||
    value === "likes" ||
    value === "comments" ||
    value === "category" ||
    value === "categoryDesc"
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
    categoryName?: string | null;
  },
  b: {
    createdAt: Date;
    likeCount: number;
    commentsCount: number;
    viewCount: number;
    id: bigint | number;
    categoryName?: string | null;
  },
) {
  const latestFirst =
    b.createdAt.getTime() - a.createdAt.getTime() + Number(b.id) - Number(a.id);
  const oldestFirst =
    a.createdAt.getTime() - b.createdAt.getTime() + Number(a.id) - Number(b.id);

  if (sort === "oldest") {
    return oldestFirst;
  }

  if (sort === "views") {
    return b.viewCount - a.viewCount || latestFirst;
  }

  if (sort === "likes") {
    return b.likeCount - a.likeCount || latestFirst;
  }

  if (sort === "comments") {
    return b.commentsCount - a.commentsCount || latestFirst;
  }

  if (sort === "category") {
    return (
      (a.categoryName ?? "").localeCompare(b.categoryName ?? "") || latestFirst
    );
  }

  if (sort === "categoryDesc") {
    return (
      (b.categoryName ?? "").localeCompare(a.categoryName ?? "") || latestFirst
    );
  }

  return latestFirst;
}
