import type { Metadata } from "next";

import BannerBar from "@/components/layout/BannerBar";
import Header from "@/components/layout/Header";
import LoginWelcomeToast from "@/components/layout/LoginWelcomeToast";
import PopularPosts from "@/components/sidebar/PopularPosts";
// import RecommendedKeywords from "@/components/sidebar/RecommendedKeywords";
import "@/app/globals.css";
import AuthSessionProvider from "@/components/providers/SessionProvider";
import RecommendedCategories from "@/components/home/RecommendedCategories";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.horok.co.kr"),
  title: "호록(Horok) - 나만의 포스트",
  description: "호록이와 다양한 이야기를 나누고 기록해 보세요.",
  openGraph: {
    title: "호록(Horok) - 나만의 포스트",
    description: "호록이와 다양한 이야기를 나누고 기록해 보세요.",
    url: "https://www.horok.co.kr",
    siteName: "c.Horok",
    images: [
      {
        url: "/logo.svg",
        alt: "Horok Logo",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="flex h-screen flex-col overflow-hidden">
        <AuthSessionProvider>
          <Header />
          <LoginWelcomeToast />

          <BannerBar />
          {/* Main */}
          <main
            className="
    mx-auto
    flex
    w-full
    max-w-6xl
    flex-1
    overflow-hidden
  "
          >
            {/* Left Sidebar */}
            <aside
              className="
    hidden
    w-1/4
    md:block
    py-6
    h-full
    sticky
    top-0
  "
            >
              {/* 세로 구분선 */}
              <div className="flex h-full px-6 flex-col border-r py-6">
                <div className="space-y-8">
                  <PopularPosts />
                  {/* <RecommendedKeywords /> */}
                  <RecommendedCategories />
                </div>

                {/* Footer */}
                <footer className="mt-auto text-center text-xs text-muted-foreground">
                  © 2026 | c.horok | All rights reserved.
                </footer>
              </div>
            </aside>

            {/* Main Content */}
            <section
              className="
    w-full
    md:w-2/3
    px-4
    md:px-6
    py-6
    h-[calc(100vh-104px)]
    overflow-y-auto
    scrollbar-hide
  "
            >
              {children}
            </section>
          </main>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
