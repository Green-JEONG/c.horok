import { auth } from "@/app/api/auth/[...nextauth]/route";
import PostCard from "@/components/posts/PostCard";
import { getUserIdByEmail } from "@/lib/db";
import { getLikedPosts } from "@/lib/queries";

export default async function LikedPostList() {
  const session = await auth();

  if (!session?.user?.email) {
    return (
      <div className="text-sm text-muted-foreground">
        로그인 후 좋아요한 게시글을 볼 수 있습니다.
      </div>
    );
  }

  const userId = await getUserIdByEmail(session.user.email);

  if (!userId) {
    return (
      <div className="text-sm text-muted-foreground">
        사용자 정보를 찾을 수 없습니다.
      </div>
    );
  }

  const posts = await getLikedPosts(userId);

  if (posts.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        아직 좋아요한 게시글이 없습니다.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          id={post.id}
          title={post.title}
          description={post.content}
          thumbnail={post.thumbnail}
          category={post.category_name}
          author={post.author_name}
          likes={post.likes_count}
          comments={post.comments_count}
          createdAt={post.created_at}
        />
      ))}
    </div>
  );
}
