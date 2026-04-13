"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

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
  title,
  friends,
  emptyMessage,
}: {
  title: string;
  friends: Friend[];
  emptyMessage: string;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>

      {friends.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="flex gap-4 overflow-x-auto pb-2">
          {friends.map((friend) => (
            <li key={`${title}-${friend.id}`} className="shrink-0">
              <Link
                href={`/users/${friend.id}`}
                className="flex min-w-32 flex-col items-center rounded-xl border bg-background px-4 py-4 text-center transition-colors hover:bg-muted"
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
    return <p className="text-sm text-muted-foreground">불러오는 중…</p>;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">구독</h2>

      <FriendList
        title="구독자"
        friends={friends.followers}
        emptyMessage="나를 구독한 유저가 없습니다."
      />
      <FriendList
        title="구독 중"
        friends={friends.following}
        emptyMessage="구독 중인 유저가 없습니다."
      />
    </section>
  );
}
