"use client";

import { usePathname } from "next/navigation";

type AppShellProps = {
  header: React.ReactNode;
  banner: React.ReactNode;
  sidebar: React.ReactNode;
  footer: React.ReactNode;
  chat: React.ReactNode;
  children: React.ReactNode;
};

export default function AppShell({
  header,
  banner,
  sidebar,
  footer,
  chat,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const isPortalPage = pathname === "/";
  const isHorokTechPage =
    pathname === "/horok-tech" || pathname.startsWith("/horok-tech/");
  const isHorokCotePage =
    pathname === "/horok-cote" || pathname.startsWith("/horok-cote/");
  const isChatEnabledPage = isHorokTechPage || isHorokCotePage;
  const isStandaloneServicePage =
    isHorokCotePage ||
    pathname === "/horok-tv" ||
    pathname.startsWith("/horok-tv/") ||
    pathname === "/horok-shop" ||
    pathname.startsWith("/horok-shop/");

  if (isPortalPage || isStandaloneServicePage) {
    return (
      <>
        <main className="min-h-dvh">{children}</main>
        {isChatEnabledPage ? chat : null}
      </>
    );
  }

  return (
    <>
      {header}
      {banner}
      <main className="mx-auto flex w-full max-w-6xl flex-1 md:min-h-0 md:overflow-hidden">
        <aside className="sticky top-0 hidden h-full w-1/4 md:block">
          <div className="relative flex h-full flex-col px-6 py-6">
            <div className="pointer-events-none absolute inset-y-6 right-0 w-px bg-border" />
            <div className="space-y-8">{sidebar}</div>
            {footer}
          </div>
        </aside>

        <section className="scrollbar-hide w-full px-4 py-6 md:min-h-0 md:w-2/3 md:overflow-y-auto md:px-6">
          {children}
        </section>
      </main>
      {isChatEnabledPage ? chat : null}
    </>
  );
}
