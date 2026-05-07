import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import PostEditor from "@/components/posts/PostEditor";
import { NOTICE_TAG_OPTIONS } from "@/lib/notice-categories";

export const metadata: Metadata = {
  title: "공지사항 작성 | c.horok",
  description: "공지사항 및 QnA 작성 페이지",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function HorokTechNewNoticePage() {
  const session = await auth();

  if (!session) {
    redirect("/horok-tech/notices");
  }

  const isAdmin = session.user.role === "ADMIN";
  const fixedTagOptions = isAdmin ? [...NOTICE_TAG_OPTIONS] : ["QnA"];
  const initialCategoryName = isAdmin ? NOTICE_TAG_OPTIONS[0] : "QnA";
  const isUserQnaMode = !isAdmin;

  return (
    <main className="mx-auto max-w-3xl">
      <PostEditor
        initialCategoryName={initialCategoryName}
        categoryLocked
        successPathPrefix="/horok-tech/notices"
        fixedTagOptions={fixedTagOptions}
        showThumbnailTab={!isUserQnaMode}
        showBannerOption={!isUserQnaMode}
      />
    </main>
  );
}
