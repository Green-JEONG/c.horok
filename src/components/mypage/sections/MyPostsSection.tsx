"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import SectionPagination from "@/components/mypage/sections/SectionPagination";
import PostCard from "@/components/posts/PostCard";
import { getPostDraftStorageKey, loadPostDraft } from "@/lib/post-drafts";
import { getTechFeedNewPostPath } from "@/lib/routes";

const PAGE_SIZE = 12;

type MyPost = {
  id: number;
  title: string;
  content: string;
  thumbnail: string | null;
  created_at: Date | string;
  author_name: string;
  author_image?: string | null;
  category_name: string;
  likes_count: number;
  comments_count: number;
  is_hidden: boolean;
  is_secret: boolean;
};

type DraftPost = MyPost & {
  is_draft?: boolean;
  href_override?: string;
};

export default function MyPostsSection() {
  const { status } = useSession();
  const [posts, setPosts] = useState<DraftPost[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasNextPage, setHasNextPage] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadPosts = async () => {
      setLoading(true);

      try {
        const response = await fetch(`/api/mypage/posts?page=${page}`);
        const data: MyPost[] = await response.json();
        const draftStorageKey = getPostDraftStorageKey({
          successPathPrefix: "/horok-tech/feeds/posts",
          fixedTagOptions: [],
          categoryLocked: false,
        });
        const draft =
          status === "authenticated" && page === 1
            ? loadPostDraft(draftStorageKey)
            : null;
        const draftPost =
          draft && page === 1
            ? ({
                id: -1,
                title: draft.title.trim() || "임시저장된 글",
                content: draft.content.trim() || "임시 저장된 글입니다.",
                thumbnail: draft.thumbnailUrl,
                created_at: draft.savedAt,
                author_name: "나",
                category_name: "임시저장",
                likes_count: 0,
                comments_count: 0,
                is_hidden: false,
                is_secret: false,
                is_draft: true,
                href_override: getTechFeedNewPostPath(),
              } satisfies DraftPost)
            : null;
        const mergedPosts =
          Array.isArray(data) && draftPost
            ? [draftPost, ...data.slice(0, PAGE_SIZE - 1)]
            : Array.isArray(data)
              ? data
              : [];

        if (cancelled) return;

        setPosts(mergedPosts);
        setHasNextPage(Array.isArray(data) && data.length >= PAGE_SIZE);
      } catch {
        if (cancelled) return;
        setPosts([]);
        setHasNextPage(false);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadPosts();

    return () => {
      cancelled = true;
    };
  }, [page, status]);

  const totalPages = hasNextPage ? page + 1 : page;

  return (
    <section className="space-y-4" id="mypage-posts">
      <h2 className="text-lg font-semibold">내가 쓴 글</h2>

      {loading ? (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">작성한 글이 없습니다.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                id={post.id}
                title={post.title}
                description={post.content}
                thumbnail={post.thumbnail}
                category={post.category_name}
                author="나"
                authorImage={post.author_image}
                likes={post.likes_count}
                comments={post.comments_count}
                createdAt={new Date(post.created_at)}
                isHidden={post.is_hidden}
                isSecret={post.is_secret}
                hrefOverride={post.href_override}
                showCategoryBadge={!post.is_draft}
                statusBadges={[
                  post.is_draft
                    ? {
                        text: "임시저장",
                        className: "border-sky-300 bg-sky-100 text-black",
                      }
                    : null,
                ].filter((badge) => badge !== null)}
              />
            ))}
          </div>
          <SectionPagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </section>
  );
}
