import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import PostListHeader from "@/components/posts/PostListHeader";
import PostSortButton from "@/components/posts/PostSortButton";
import UserSearchGrid from "@/components/users/UserSearchGrid";

export const metadata: Metadata = {
  title: "검색 결과 | c.horok",
  description: "게시글 검색 결과 페이지",
  robots: {
    index: false,
    follow: true,
  },
};

import PostListInfinite from "@/components/posts/PostListInfinite";
import {
  POST_SEARCH_TARGET_LABEL,
  parsePostSearchTarget,
} from "@/lib/post-search-target";
import { parseSortType } from "@/lib/post-sort";
import {
  getPostsByCategorySlug,
  searchPosts,
  searchUsersByName,
} from "@/lib/queries";
import { parseUserSearchSort } from "@/lib/user-search-sort";

type Props = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: string;
    searchTarget?: string;
    userSort?: string;
  }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const { q, category, sort, searchTarget, userSort } = await searchParams;
  const categorySlug = category?.trim();
  const keyword = q?.trim();
  const parsedSort = parseSortType(sort);
  const parsedSearchTarget = parsePostSearchTarget(searchTarget);
  const parsedUserSort = parseUserSearchSort(userSort);
  const session = await auth();
  const viewerUserId =
    typeof session?.user?.id === "string" ? Number(session.user.id) : null;

  if (!keyword && !categorySlug) {
    return (
      <p className="text-sm text-muted-foreground">검색어를 입력해주세요.</p>
    );
  }

  if (categorySlug) {
    const { categoryName, posts } = await getPostsByCategorySlug(
      categorySlug,
      12,
      0,
      parsedSort,
      {
        viewerUserId:
          typeof viewerUserId === "number" && !Number.isNaN(viewerUserId)
            ? viewerUserId
            : null,
        isAdmin: session?.user?.role === "ADMIN",
      },
    );

    if (!categoryName) {
      return (
        <p className="text-sm text-muted-foreground">
          선택한 카테고리를 찾을 수 없습니다.
        </p>
      );
    }

    if (posts.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          “#{categoryName}”에 대한 게시글이 없습니다.
        </p>
      );
    }

    return (
      <div className="space-y-4">
        <PostListHeader title={`#${categoryName}`} showWriteButton={false} />

        <PostListInfinite
          initialPosts={posts}
          endpoint={`/api/categories/${categorySlug}/posts`}
          initialSort={parsedSort}
          responseKey="posts"
          syncSortWithSearchParams
          gridClassName="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          emptyMessage={`“#${categoryName}”에 대한 게시글이 없습니다.`}
        />
      </div>
    );
  }

  const [users, posts] = await Promise.all([
    parsedSearchTarget === "author"
      ? searchUsersByName(keyword ?? "", 60, parsedUserSort, viewerUserId)
      : [],
    searchPosts(keyword ?? "", 12, 0, parsedSort, {
      includeNotices: true,
      viewerUserId:
        typeof viewerUserId === "number" && !Number.isNaN(viewerUserId)
          ? viewerUserId
          : null,
      isAdmin: session?.user?.role === "ADMIN",
      searchTarget: parsedSearchTarget,
    }),
  ]);

  const showUserSection = users.length > 0;
  const hasResults = users.length > 0 || posts.length > 0;
  const totalResultCount = users.length + posts.length;

  return (
    <div className="space-y-8">
      <PostListHeader
        title="검색"
        titleAction={
          <span className="inline-flex min-w-0 items-center gap-1 text-lg font-bold tracking-tight text-foreground">
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="shrink-0">
              {POST_SEARCH_TARGET_LABEL[parsedSearchTarget]}
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{keyword}</span>
            <span className="ml-1 shrink-0 text-sm font-medium text-muted-foreground">
              {totalResultCount}
            </span>
          </span>
        }
        showWriteButton={false}
        showSortButton={false}
      />

      {showUserSection ? (
        <UserSearchGrid users={users} title="유저" showSortButton />
      ) : null}

      {!hasResults ? (
        <p className="text-sm text-muted-foreground">
          “{keyword}”에 대한 검색 결과가 없습니다.
        </p>
      ) : null}

      {posts.length > 0 ? (
        <div>
          <PostListInfinite
            initialPosts={posts}
            endpoint={`/api/search?q=${encodeURIComponent(keyword ?? "")}&searchTarget=${parsedSearchTarget}`}
            initialSort={parsedSort}
            syncSortWithSearchParams
            groupBySearchCategory
            searchGroupTitleAction={<PostSortButton />}
            faqSearchGroupTitleAction={
              <PostSortButton sortOptions={["latest", "views"]} />
            }
            gridClassName="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            emptyMessage="게시물 검색 결과가 없습니다."
          />
        </div>
      ) : null}
    </div>
  );
}
