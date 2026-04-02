import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "영상 | c.horok",
  description: "영상 콘텐츠 페이지",
};

export default function VideosPage() {
  return (
    <section>
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">영상</h2>
        <p className="text-sm text-muted-foreground">
          영상 콘텐츠는 현재 준비 중입니다.
        </p>
      </div>
    </section>
  );
}
