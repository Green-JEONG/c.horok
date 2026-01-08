import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

type Category = { id: number; name: string };
type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "ADMIN";
  provider: string | null;
  created_at: string;
};
type PostRow = {
  id: number;
  title: string;
  created_at: string;
  is_deleted: number;
  user_id: string;
  author_email: string | null;
  author_name: string | null;
  category_id: number;
  category_name: string | null;
  content: string;
};
type CommentRow = {
  id: number;
  post_id: number;
  user_id: string;
  author_email: string | null;
  author_name: string | null;
  content: string;
  is_deleted: number;
  created_at: string;
  post_title: string | null;
};

const LIMIT_USERS = 30;
const LIMIT_POSTS = 20;
const LIMIT_COMMENTS = 30;

function clampText(s: string, n: number) {
  const t = s ?? "";
  return t.length > n ? t.slice(0, n) + "…" : t;
}

export default async function AdminPage() {
  // ✅ 관리자만 접근
  const session = await auth();
  const role = session?.user?.role;

  if (!session) redirect("/");
  if (role !== "ADMIN") redirect("/");

  // ====== 데이터 로드 ======
  const [catRows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name FROM categories ORDER BY name ASC`,
  );

  const categories: Category[] = catRows.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
  }));

  const [userRows] = await pool.query<RowDataPacket[]>(
    `
    SELECT id, name, email, role, provider, created_at
    FROM users
    ORDER BY created_at DESC
    LIMIT ?
    `,
    [LIMIT_USERS],
  );

  const users: UserRow[] = userRows.map((r) => ({
    id: String(r.id),
    name: r.name ? String(r.name) : null,
    email: String(r.email),
    role: (r.role as "USER" | "ADMIN") ?? "USER",
    provider: r.provider ? String(r.provider) : null,
    created_at: String(r.created_at),
  }));

  const [postRows] = await pool.query<RowDataPacket[]>(
    `
    SELECT
      p.id,
      p.title,
      p.content,
      p.created_at,
      p.is_deleted,
      p.user_id,
      p.category_id,
      u.email AS author_email,
      u.name  AS author_name,
      c.name  AS category_name
    FROM posts p
    LEFT JOIN users u ON u.id = p.user_id
    LEFT JOIN categories c ON c.id = p.category_id
    ORDER BY p.created_at DESC
    LIMIT ?
    `,
    [LIMIT_POSTS],
  );

  const posts: PostRow[] = postRows.map((r) => ({
    id: Number(r.id),
    title: String(r.title),
    content: String(r.content ?? ""),
    created_at: String(r.created_at),
    is_deleted: Number(r.is_deleted ?? 0),
    user_id: String(r.user_id),
    author_email: r.author_email ? String(r.author_email) : null,
    author_name: r.author_name ? String(r.author_name) : null,
    category_id: Number(r.category_id),
    category_name: r.category_name ? String(r.category_name) : null,
  }));

  const [commentRows] = await pool.query<RowDataPacket[]>(
    `
    SELECT
      cm.id,
      cm.post_id,
      cm.user_id,
      cm.content,
      cm.is_deleted,
      cm.created_at,
      u.email AS author_email,
      u.name  AS author_name,
      p.title AS post_title
    FROM comments cm
    LEFT JOIN users u ON u.id = cm.user_id
    LEFT JOIN posts p ON p.id = cm.post_id
    ORDER BY cm.created_at DESC
    LIMIT ?
    `,
    [LIMIT_COMMENTS],
  );

  const comments: CommentRow[] = commentRows.map((r) => ({
    id: Number(r.id),
    post_id: Number(r.post_id),
    user_id: String(r.user_id),
    author_email: r.author_email ? String(r.author_email) : null,
    author_name: r.author_name ? String(r.author_name) : null,
    content: String(r.content ?? ""),
    is_deleted: Number(r.is_deleted ?? 0),
    created_at: String(r.created_at),
    post_title: r.post_title ? String(r.post_title) : null,
  }));

  // ====== Server Actions (이 파일 하나 안에서 처리) ======
  async function createPostAction(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") return;

    const title = String(formData.get("title") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim();
    const categoryId = Number(formData.get("categoryId") ?? 0);

    if (!title || !content || Number.isNaN(categoryId) || categoryId <= 0)
      return;

    // ✅ 관리자 글 작성: 작성자(user_id)는 현재 로그인한 "users.id"와 타입이 맞아야 함
    // 프로젝트 DB가 users.id를 숫자/문자 혼용 중이라 안전하게 "이메일 기반으로 users.id 조회" 후 사용합니다.
    const email = session.user.email;
    if (!email) return;

    const [urows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM users WHERE email = ? LIMIT 1`,
      [email],
    );
    if (urows.length === 0) return;

    const userId = String(urows[0].id);

    await pool.query<ResultSetHeader>(
      `
      INSERT INTO posts (user_id, category_id, title, content)
      VALUES (?, ?, ?, ?)
      `,
      [userId, categoryId, title, content],
    );
  }

  async function updatePostAction(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") return;

    const postId = Number(formData.get("postId") ?? 0);
    const title = String(formData.get("title") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim();
    const categoryId = Number(formData.get("categoryId") ?? 0);

    if (Number.isNaN(postId) || postId <= 0) return;
    if (!title || !content || Number.isNaN(categoryId) || categoryId <= 0)
      return;

    await pool.query<ResultSetHeader>(
      `
      UPDATE posts
      SET title = ?, content = ?, category_id = ?
      WHERE id = ?
      `,
      [title, content, categoryId, postId],
    );
  }

  async function deletePostAction(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") return;

    const postId = Number(formData.get("postId") ?? 0);
    if (Number.isNaN(postId) || postId <= 0) return;

    // ✅ 프로젝트가 soft delete 쓰고 있어서 soft delete로 처리
    await pool.query<ResultSetHeader>(
      `
      UPDATE posts
      SET is_deleted = 1, deleted_at = NOW()
      WHERE id = ?
      `,
      [postId],
    );
  }

  async function deleteCommentAction(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") return;

    const commentId = Number(formData.get("commentId") ?? 0);
    if (Number.isNaN(commentId) || commentId <= 0) return;

    // ✅ comments도 soft delete 컬럼 존재
    await pool.query<ResultSetHeader>(
      `
      UPDATE comments
      SET is_deleted = 1
      WHERE id = ?
      `,
      [commentId],
    );
  }

  async function changeUserRoleAction(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") return;

    const userId = String(formData.get("userId") ?? "");
    const role = String(formData.get("role") ?? "USER");
    if (!userId || (role !== "USER" && role !== "ADMIN")) return;

    await pool.query<ResultSetHeader>(
      `
      UPDATE users
      SET role = ?
      WHERE id = ?
      `,
      [role, userId],
    );
  }

  async function deleteUserAction(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") return;

    const userId = String(formData.get("userId") ?? "");
    if (!userId) return;

    await pool.query<ResultSetHeader>(`DELETE FROM users WHERE id = ?`, [
      userId,
    ]);
  }

  // ====== UI ======
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-10">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="text-sm text-muted-foreground">
            글/회원/댓글 관리를 한 화면에서 처리합니다.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          로그인: <span className="font-medium">{session.user.email}</span>
        </div>
      </header>

      {/* ===== 글쓰기 ===== */}
      <section className="rounded-2xl border p-6 bg-background">
        <h2 className="text-lg font-semibold mb-4">글쓰기</h2>

        <form action={createPostAction} className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <input
              name="title"
              placeholder="제목"
              className="md:col-span-2 w-full rounded-md border px-3 py-2 text-sm"
              required
            />
            <select
              name="categoryId"
              className="w-full rounded-md border px-3 py-2 text-sm"
              required
              defaultValue={categories[0]?.id ?? 0}
            >
              {categories.length === 0 ? (
                <option value={0}>카테고리 없음</option>
              ) : (
                categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <textarea
            name="content"
            placeholder="내용"
            className="min-h-40 w-full rounded-md border px-3 py-2 text-sm"
            required
          />

          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            작성하기
          </button>

          <p className="text-xs text-muted-foreground">
            ※ 제출 후 새로고침하면 최신 목록에 반영됩니다.
          </p>
        </form>
      </section>

      {/* ===== 글 관리 (수정/삭제) ===== */}
      <section className="rounded-2xl border p-6 bg-background">
        <h2 className="text-lg font-semibold mb-4">글 관리</h2>

        <div className="space-y-4">
          {posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">게시글이 없습니다.</p>
          ) : (
            posts.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border p-4 bg-muted/30 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">
                      #{p.id} {p.title}{" "}
                      {p.is_deleted ? (
                        <span className="ml-2 rounded bg-red-500/10 px-2 py-0.5 text-xs text-red-500">
                          DELETED
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.created_at} · {p.author_name ?? "Unknown"}(
                      {p.author_email ?? "no-email"}) ·{" "}
                      {p.category_name ?? `category:${p.category_id}`}
                    </p>
                  </div>

                  <a
                    className="text-xs underline text-muted-foreground hover:text-foreground"
                    href={`/posts/${p.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    상세보기
                  </a>
                </div>

                {/* 수정 폼 */}
                <form action={updatePostAction} className="space-y-2">
                  <input type="hidden" name="postId" value={p.id} />

                  <div className="grid gap-2 md:grid-cols-3">
                    <input
                      name="title"
                      defaultValue={p.title}
                      className="md:col-span-2 w-full rounded-md border px-3 py-2 text-sm"
                      required
                    />
                    <select
                      name="categoryId"
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      defaultValue={p.category_id}
                      required
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <textarea
                    name="content"
                    defaultValue={p.content}
                    className="min-h-30 w-full rounded-md border px-3 py-2 text-sm"
                    required
                  />

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="rounded-md border bg-background px-3 py-2 text-sm hover:bg-muted"
                    >
                      수정 저장
                    </button>
                  </div>
                </form>

                {/* 삭제 폼 */}
                <form action={deletePostAction}>
                  <input type="hidden" name="postId" value={p.id} />
                  <button
                    type="submit"
                    className="rounded-md border px-3 py-2 text-sm text-red-500 hover:bg-red-500/10"
                  >
                    삭제(soft delete)
                  </button>
                </form>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ===== 댓글 관리 (삭제) ===== */}
      <section className="rounded-2xl border p-6 bg-background">
        <h2 className="text-lg font-semibold mb-4">댓글 관리 (삭제)</h2>

        <div className="space-y-3">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">댓글이 없습니다.</p>
          ) : (
            comments.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border p-4 bg-muted/30 flex items-start justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    #{c.id}{" "}
                    {c.is_deleted ? (
                      <span className="ml-2 rounded bg-red-500/10 px-2 py-0.5 text-xs text-red-500">
                        DELETED
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-sm">{clampText(c.content, 180)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c.created_at} · {c.author_name ?? "Unknown"}(
                    {c.author_email ?? "no-email"}) · 글:{" "}
                    {c.post_title ?? `post#${c.post_id}`}
                  </p>

                  <a
                    className="mt-1 inline-block text-xs underline text-muted-foreground hover:text-foreground"
                    href={`/posts/${c.post_id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    글로 이동
                  </a>
                </div>

                <form action={deleteCommentAction}>
                  <input type="hidden" name="commentId" value={c.id} />
                  <button
                    type="submit"
                    className="shrink-0 rounded-md border px-3 py-2 text-sm text-red-500 hover:bg-red-500/10"
                  >
                    댓글 삭제(soft)
                  </button>
                </form>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ===== 회원 관리 ===== */}
      <section className="rounded-2xl border p-6 bg-background">
        <h2 className="text-lg font-semibold mb-4">회원 관리</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left">
              <tr className="border-b">
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">이름</th>
                <th className="py-2 pr-4">이메일</th>
                <th className="py-2 pr-4">Provider</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">생성일</th>
                <th className="py-2 pr-0">작업</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b align-top">
                  <td className="py-2 pr-4 whitespace-nowrap">{u.id}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">
                    {u.name ?? "-"}
                  </td>
                  <td className="py-2 pr-4">{u.email}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">
                    {u.provider ?? "-"}
                  </td>

                  {/* Role 변경 */}
                  <td className="py-2 pr-4">
                    <form
                      action={changeUserRoleAction}
                      className="flex items-center gap-2"
                    >
                      <input type="hidden" name="userId" value={u.id} />
                      <select
                        name="role"
                        defaultValue={u.role}
                        className="rounded-md border px-2 py-1 text-xs"
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                      <button
                        type="submit"
                        className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
                      >
                        변경
                      </button>
                    </form>
                  </td>

                  <td className="py-2 pr-4 whitespace-nowrap">
                    {u.created_at}
                  </td>

                  {/* 회원 삭제 */}
                  <td className="py-2 pr-0">
                    <form action={deleteUserAction}>
                      <input type="hidden" name="userId" value={u.id} />
                      <button
                        type="submit"
                        className="rounded-md border px-2 py-1 text-xs text-red-500 hover:bg-red-500/10"
                      >
                        회원 삭제
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-6 text-center text-muted-foreground"
                  >
                    회원이 없습니다.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
