import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import PostEditor from "@/components/posts/PostEditor";
import { NOTICE_TAG_OPTIONS } from "@/lib/notice-categories";

export const metadata: Metadata = {
  title: "공지 작성 | c.horok",
  description: "관리자 전용 공지사항 작성 페이지",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function HorokTechNewNoticePage() {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/horok-tech/notices");
  }

  return (
    <main className="mx-auto max-w-3xl">
      <PostEditor
        initialCategoryName={NOTICE_TAG_OPTIONS[0]}
        categoryLocked
        successPathPrefix="/horok-tech/notices"
        fixedTagOptions={[...NOTICE_TAG_OPTIONS]}
      />
    </main>
  );
}
