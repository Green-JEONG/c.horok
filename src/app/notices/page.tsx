import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "공지사항 | c.horok",
  description: "공지사항 페이지",
};

export default function NoticesPage() {
  return (
    <section>
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">공지사항</h2>
        <p className="text-sm text-muted-foreground">
          공지사항 콘텐츠는 현재 준비 중입니다.
        </p>
      </div>
    </section>
  );
}
