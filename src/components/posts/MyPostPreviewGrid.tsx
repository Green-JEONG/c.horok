"use client";

import { useEffect, useState } from "react";
import { getPostDraftStorageKey, loadPostDraft } from "@/lib/post-drafts";
import { getTechFeedNewPostPath } from "@/lib/routes";
import PostCard from "./PostCard";

type PreviewPost = {
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
  is_secret?: boolean;
  can_view_secret?: boolean;
};

type DraftPreviewPost = PreviewPost & {
  is_draft?: boolean;
  href_override?: string;
};

function getPreviewVisibilityClassName(index: number) {
  if (index < 4) {
    return "";
  }

  if (index < 6) {
    return "hidden sm:block";
  }

  if (index < 8) {
    return "hidden lg:block";
  }

  if (index < 10) {
    return "hidden xl:block";
  }

  return "hidden";
}

export default function MyPostPreviewGrid({
  posts,
  limit,
}: {
  posts: PreviewPost[];
  limit: number;
}) {
  const [mergedPosts, setMergedPosts] = useState<DraftPreviewPost[]>(posts);

  useEffect(() => {
    const draftStorageKey = getPostDraftStorageKey({
      successPathPrefix: "/horok-tech/feeds/posts",
      fixedTagOptions: [],
      categoryLocked: false,
    });
    const draft = loadPostDraft(draftStorageKey);
    const draftPost = draft
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
          is_draft: true,
          href_override: getTechFeedNewPostPath(),
        } satisfies DraftPreviewPost)
      : null;

    setMergedPosts(
      draftPost
        ? [draftPost, ...posts.slice(0, limit - 1)]
        : posts.slice(0, limit),
    );
  }, [limit, posts]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {mergedPosts.map((post, index) => (
        <div key={post.id} className={getPreviewVisibilityClassName(index)}>
          <PostCard
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
            canViewSecret={post.can_view_secret}
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
        </div>
      ))}
    </div>
  );
}
