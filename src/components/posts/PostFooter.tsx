import Link from "next/link";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { pool } from "@/lib/db";
import type { RowDataPacket } from "mysql2/promise";
import LikeButton from "./LikeButton";

type Props = { postId: number };

export default async function PostFooter({ postId }: Props) {
  // 1) 좋아요 수
  const [[likeRow]] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS count FROM post_likes WHERE post_id = ?`,
    [postId],
  );
  const likeCount = Number(likeRow?.count ?? 0);

  // 2) 로그인 유저면, 내가 좋아요 눌렀는지
  const session = await auth();
  let liked = false;

  if (session?.user?.email) {
    const [urows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM users WHERE email = ? LIMIT 1`,
      [session.user.email],
    );

    if (urows.length > 0) {
      const userId = urows[0].id as number;
      const [lrows] = await pool.query<RowDataPacket[]>(
        `SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ? LIMIT 1`,
        [postId, userId],
      );
      liked = lrows.length > 0;
    }
  }

  return (
    <footer className="mt-16 flex items-center justify-between border-t pt-6">
      <LikeButton
        postId={postId}
        initialLiked={liked}
        initialCount={likeCount}
      />

      <Link href="/" className="text-sm text-muted-foreground hover:underline">
        ← 목록으로
      </Link>
    </footer>
  );
}
