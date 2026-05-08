"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import SectionPagination from "@/components/mypage/sections/SectionPagination";

const DEFAULT_PAGE_SIZE = 2;

function getResponsiveFriendPageSize() {
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

type Friend = {
  id: number;
  name: string | null;
  image: string | null;
  followerCount: number;
};

type FriendsResponse = {
  followers: Friend[];
  following: Friend[];
};

function FriendList({
  listKey,
  title,
  friends,
  emptyMessage,
}: {
  listKey: "followers" | "following";
  title: string;
  friends: Friend[];
  emptyMessage: string;
}) {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [highlightedFriendId, setHighlightedFriendId] = useState<number | null>(
    null,
  );
  const targetFriendId = useMemo(() => {
    const value = Number(searchParams.get("friendId") ?? "");
    return Number.isFinite(value) && value > 0 ? value : null;
  }, [searchParams]);
  const targetFriendType = searchParams.get("friendType");

  useEffect(() => {
    const updatePageSize = () => {
      setPageSize((current) => {
        const next = getResponsiveFriendPageSize();
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

  const totalPages = Math.max(1, Math.ceil(friends.length / pageSize));
  const pagedFriends = friends.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (targetFriendType !== listKey || typeof targetFriendId !== "number") {
      return;
    }

    const targetIndex = friends.findIndex(
      (friend) => friend.id === targetFriendId,
    );
    if (targetIndex < 0) {
      return;
    }

    const nextPage = Math.floor(targetIndex / pageSize) + 1;
    if (nextPage !== page) {
      setPage(nextPage);
    }

    setHighlightedFriendId(targetFriendId);
  }, [friends, listKey, page, pageSize, targetFriendId, targetFriendType]);

  useEffect(() => {
    if (typeof highlightedFriendId !== "number") {
      return;
    }

    const visible = pagedFriends.some(
      (friend) => friend.id === highlightedFriendId,
    );
    if (!visible) {
      return;
    }

    const scrollTimeout = window.setTimeout(() => {
      const element = document.getElementById(
        `mypage-${listKey}-friend-${highlightedFriendId}`,
      );
      element?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 150);

    const highlightTimeout = window.setTimeout(() => {
      setHighlightedFriendId((current) =>
        current === highlightedFriendId ? null : current,
      );
    }, 2600);

    return () => {
      window.clearTimeout(scrollTimeout);
      window.clearTimeout(highlightTimeout);
    };
  }, [highlightedFriendId, listKey, pagedFriends]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-sm font-medium text-muted-foreground">
          {friends.length}
        </span>
      </div>

      {friends.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {pagedFriends.map((friend) => (
              <li
                key={`${title}-${friend.id}`}
                id={`mypage-${listKey}-friend-${friend.id}`}
                className="min-w-0 rounded-xl transition-colors"
              >
                <Link
                  href={`/users/${friend.id}`}
                  className={`flex h-full min-w-0 flex-col items-center rounded-xl border bg-background px-4 py-4 text-center transition-colors hover:bg-muted ${
                    highlightedFriendId === friend.id
                      ? "border-primary bg-primary/5"
                      : ""
                  }`}
                >
                  <Image
                    src={friend.image ?? "/logo.svg"}
                    alt={`${friend.name ?? "구독 유저"} 프로필`}
                    width={72}
                    height={72}
                    className="h-18 w-18 rounded-full border object-cover"
                  />
                  <p className="mt-3 w-full truncate font-medium">
                    {friend.name ?? "이름 없는 사용자"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    구독자 {friend.followerCount}명
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          <SectionPagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

export default function MyFriendsSection() {
  const [friends, setFriends] = useState<FriendsResponse>({
    followers: [],
    following: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/mypage/friends");
        if (!res.ok) throw new Error();

        const data: FriendsResponse = await res.json();
        setFriends(data);
      } catch {
        setFriends({ followers: [], following: [] });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <section className="space-y-16">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">나를 구독하는 유저</h2>
            <span className="text-sm font-medium text-muted-foreground">0</span>
          </div>
          <p className="text-sm text-muted-foreground">불러오는 중…</p>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">내가 구독하는 유저</h2>
            <span className="text-sm font-medium text-muted-foreground">0</span>
          </div>
          <p className="text-sm text-muted-foreground">불러오는 중…</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-16">
      <FriendList
        listKey="followers"
        title="나를 구독하는 유저"
        friends={friends.followers}
        emptyMessage="나를 구독한 유저가 없습니다."
      />
      <FriendList
        listKey="following"
        title="내가 구독하는 유저"
        friends={friends.following}
        emptyMessage="구독 중인 유저가 없습니다."
      />
    </section>
  );
}
