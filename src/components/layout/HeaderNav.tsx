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
];

export default function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-6 text-sm font-medium">
      {navItems.map((item) => {
        const isActive = item.match(pathname);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "transition-colors",
              isActive
                ? "text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
