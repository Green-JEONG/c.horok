"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import SectionPagination from "@/components/mypage/sections/SectionPagination";
import UserSearchSortButton from "@/components/users/UserSearchSortButton";
import type { DbUserSearchResult } from "@/lib/queries";

const DEFAULT_PAGE_SIZE = 2;

function getResponsiveUserPageSize() {
  if (typeof window === "undefined") {
    return DEFAULT_PAGE_SIZE;
  }

  if (window.innerWidth >= 1280) {
    return 5;
  }

  if (window.innerWidth >= 1024) {
    return 4;
  }

  if (window.innerWidth >= 640) {
    return 3;
  }

  return 2;
}

type Props = {
  users: DbUserSearchResult[];
  title?: string;
  showSortButton?: boolean;
};

export default function UserSearchGrid({
  users,
  title = "유저",
  showSortButton = false,
}: Props) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    const updatePageSize = () => {
      setPageSize((current) => {
        const next = getResponsiveUserPageSize();
        if (current !== next) {
          setPage(1);
        }
        return current === next ? current : next;
      });
    };

    updatePageSize();
    window.addEventListener("resize", updatePageSize);

    return () => {
      window.removeEventListener("resize", updatePageSize);
    };
  }, []);

  if (users.length === 0) {
    return null;
  }

  const totalPages = Math.max(1, Math.ceil(users.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedUsers = users.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold">{title}</h2>
          <span className="text-sm font-medium text-muted-foreground">
            {users.length}
          </span>
        </div>
        {showSortButton ? <UserSearchSortButton /> : null}
      </div>

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {pagedUsers.map((user) => (
          <li key={user.id} className="min-w-0 rounded-xl transition-colors">
            <Link
              href={`/users/${user.id}`}
              className="flex h-full min-w-0 flex-col items-center rounded-xl border bg-background px-4 py-4 text-center transition-colors hover:bg-muted"
            >
              <Image
                src={user.image ?? "/logo.png"}
                alt={`${user.name ?? "검색 유저"} 프로필`}
                width={72}
                height={72}
                className="h-18 w-18 rounded-full border object-cover"
              />
              <p className="mt-3 w-full truncate font-medium">
                {user.name ?? "이름 없는 사용자"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                구독자 {user.followerCount}명 · 글 {user.postCount}개
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <SectionPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </section>
  );
}
