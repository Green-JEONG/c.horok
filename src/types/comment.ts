export type CommentTree = {
  id: number;
  post_id: number;
  user_id: number;
  parent_id: number | null;
  content: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  author_name: string;
  author_image: string | null;
  replies: CommentTree[];
};
