import type { Meta, StoryObj } from "@storybook/react";
import PostListInfinite from "@/components/posts/PostListInfinite";

const mockPosts = Array.from({ length: 8 }).map((_, i) => ({
  id: i + 1,
  title: `초기 게시글 ${i + 1}`,
  content: "무한 스크롤 테스트용 게시글입니다.",
  thumbnail: null,
  category_name: "React",
  author_name: "홍초",
  view_count: Math.floor(Math.random() * 100),
  likes_count: Math.floor(Math.random() * 10),
  comments_count: Math.floor(Math.random() * 5),
  created_at: new Date(),
  updated_at: new Date(),
}));

const meta: Meta<typeof PostListInfinite> = {
  title: "Posts/InfiniteScroll",
  component: PostListInfinite,
};

export default meta;

export const Default: StoryObj<typeof PostListInfinite> = {
  args: {
    initialPosts: mockPosts,
    endpoint: "/api/posts",
  },
};
