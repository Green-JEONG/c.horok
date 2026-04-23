import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "코딩테스트 | c.horok",
  description: "코딩테스트 콘텐츠 페이지",
  alternates: {
    canonical: "/horok-cote",
  },
};

export default function HorokCotePage() {
  return (
    <section>
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">코딩테스트</h2>
        <p className="text-sm text-muted-foreground">
          코딩테스트 콘텐츠는 현재 준비 중입니다.
        </p>
      </div>
    </section>
  );
}
