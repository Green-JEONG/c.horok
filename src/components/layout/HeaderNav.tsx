"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/horok-tech/feeds",
    label: "소식",
    match: (p: string) =>
      p === "/horok-tech/feeds" || p.startsWith("/horok-tech/feeds/"),
  },
  {
    href: "/horok-tech/likes",
    label: "좋아요",
    match: (p: string) => p.startsWith("/horok-tech/likes"),
  },
  {
    href: "/horok-cote",
    label: "코딩테스트",
    match: (p: string) => p === "/horok-cote" || p.startsWith("/horok-cote/"),
  },
  {
    href: "/horok-tech/notices",
    label: "공지사항",
    match: (p: string) =>
      p === "/horok-tech/notices" || p.startsWith("/horok-tech/notices/"),
  },
];

export default function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav className="grid w-full grid-cols-4 gap-2 text-sm font-medium md:flex md:w-auto md:grid-cols-none md:items-center md:gap-5">
      {navItems.map((item) => {
        const isActive = item.match(pathname);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex min-w-0 items-center justify-center border-b-2 px-2 py-2 text-center whitespace-nowrap transition-colors",
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
