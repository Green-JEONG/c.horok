import type { Metadata } from "next";

import HorokChat from "@/components/chat/HorokChat";
import RecommendedCategories from "@/components/home/RecommendedCategories";
import AppShell from "@/components/layout/AppShell";
import BannerBar from "@/components/layout/BannerBar";
import Header from "@/components/layout/Header";
import LoginWelcomeToast from "@/components/layout/LoginWelcomeToast";
import AuthSessionProvider from "@/components/providers/SessionProvider";
import PopularPosts from "@/components/sidebar/PopularPosts";
import UserProfiles from "@/components/sidebar/UserProfiles";
// import RecommendedKeywords from "@/components/sidebar/RecommendedKeywords";
import "@/app/globals.css";
import { getSiteUrl } from "@/lib/site-url";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "호록이의 보금자리",
  description: "기술로 소통하고, 배움을 나누며, 성장의 발자취를 기록합니다.",
  openGraph: {
    title: "오늘의 기록이 내일의 기술이 되는 곳",
    description: "함께 공부하고, 기록하고, 나누세요.",
    url: siteUrl,
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

const themeScript = `
(() => {
  const storageKey = "theme";
  const root = document.documentElement;
  const savedTheme = window.localStorage.getItem(storageKey);
  const theme = savedTheme === "light" || savedTheme === "dark"
    ? savedTheme
    : "dark";

  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script>{themeScript}</script>
      </head>
      <body className="flex min-h-dvh flex-col overflow-x-hidden">
        <AuthSessionProvider>
          <LoginWelcomeToast />
          <AppShell
            header={<Header />}
            banner={<BannerBar />}
            sidebar={
              <>
                <UserProfiles />
                <PopularPosts />
                {/* <RecommendedKeywords /> */}
                <RecommendedCategories />
              </>
            }
            footer={
              <footer className="mt-auto text-center text-xs text-muted-foreground">
                © 2026 | c.horok | All rights reserved.
              </footer>
            }
            chat={<HorokChat />}
          >
            {children}
          </AppShell>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
