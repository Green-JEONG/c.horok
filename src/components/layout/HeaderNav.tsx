"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/feed",
    label: "피드",
    match: (p: string) => p === "/feed" || p.startsWith("/feed/"),
  },
  {
    href: "/videos",
    label: "영상",
    match: (p: string) => p === "/videos" || p.startsWith("/videos/"),
  },
  {
    href: "/coding-tests",
    label: "코딩테스트",
    match: (p: string) =>
      p === "/coding-tests" || p.startsWith("/coding-tests/"),
  },
  {
    href: "/likes",
    label: "좋아요",
    match: (p: string) => p.startsWith("/likes"),
  },
  {
    href: "/notices",
    label: "공지사항",
    match: (p: string) => p === "/notices" || p.startsWith("/notices/"),
  },
];

export default function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav className="grid w-full grid-cols-5 gap-2 text-sm font-medium md:flex md:w-auto md:grid-cols-none md:items-center md:gap-5">
      {navItems.map((item) => {
        const isActive = item.match(pathname);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex min-w-0 items-center justify-center border-b-2 px-2 py-2 text-center whitespace-nowrap transition-colors md:px-1 md:py-3",
              isActive
                ? "border-primary text-foreground font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
