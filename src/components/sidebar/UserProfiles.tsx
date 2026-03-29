"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type ProfileCard = {
  id: number;
  name: string | null;
  image: string | null;
  followerCount: number;
  isSelf: boolean;
  isFriend: boolean;
};

export default function UserProfiles() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<ProfileCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [isSubscribedHovering, setIsSubscribedHovering] = useState(false);

  useEffect(() => {
    const load = async () => {
      const selfProfile = session?.user?.id
        ? await fetch(`/api/users/${session.user.id}/profile`)
            .then((response) => {
              if (!response.ok) {
                throw new Error();
              }

              return response.json();
            })
            .catch(() => ({
              id: Number(session.user.id),
              name: session.user.name ?? null,
              image: session.user.image ?? null,
              followerCount: 0,
              isSelf: true,
              isFriend: false,
            }))
        : null;

      if (!pathname.startsWith("/posts/")) {
        const userPageMatch = pathname.match(/^\/users\/(\d+)$/);

        if (userPageMatch) {
          try {
            setLoading(true);

            const response = await fetch(
              `/api/users/${userPageMatch[1]}/profile`,
            );
            if (!response.ok) {
              throw new Error();
            }

            const data = await response.json();
            setProfile(data.isSelf ? selfProfile : data);
          } catch {
            setProfile(selfProfile);
          } finally {
            setLoading(false);
          }
          return;
        }

        setProfile(selfProfile);
        setLoading(false);
        return;
      }

      const match = pathname.match(/^\/posts\/(\d+)$/);
      if (!match) {
        setProfile(selfProfile);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const response = await fetch(`/api/posts/${match[1]}/author-profile`);
        if (!response.ok) {
          throw new Error();
        }

        const data = await response.json();
        setProfile(data.isSelf ? selfProfile : data);
      } catch {
        setProfile(selfProfile);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [pathname, session]);

  const handleToggleFriend = async (
    friendUserId: number,
    isFriend: boolean,
  ) => {
    try {
      setPendingId(friendUserId);

      const response = await fetch("/api/friends", {
        method: isFriend ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ friendUserId }),
      });

      if (!response.ok) {
        throw new Error();
      }

      setProfile((current) =>
        current && current.id === friendUserId
          ? {
              ...current,
              isFriend: !isFriend,
              followerCount: Math.max(
                0,
                current.followerCount + (isFriend ? -1 : 1),
              ),
            }
          : current,
      );
      setIsSubscribedHovering(false);
    } catch {
      window.alert(
        isFriend ? "구독 취소에 실패했습니다." : "친구 추가에 실패했습니다.",
      );
    } finally {
      setPendingId(null);
    }
  };

  return (
    <section className="-mx-6 px-6 space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold">유저 프로필</h3>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      ) : !profile ? (
        <p className="text-sm text-muted-foreground">
          표시할 프로필이 없습니다.
        </p>
      ) : (
        <div className="rounded-xl border bg-background p-4">
          <div className="flex items-center gap-3">
            <Image
              src={profile.image ?? "/logo.svg"}
              alt={`${profile.name ?? "사용자"} 프로필`}
              width={52}
              height={52}
              className="h-12 w-12 rounded-full border object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold">
                {profile.name ?? "이름 없는 사용자"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                구독자 {profile.followerCount}명
              </p>
            </div>
          </div>

          <div className="mt-3">
            {profile.isSelf ? (
              <Button size="sm" variant="secondary" className="w-full" disabled>
                내 프로필
              </Button>
            ) : status !== "authenticated" ? (
              <Button size="sm" variant="outline" className="w-full" disabled>
                로그인 후 이용
              </Button>
            ) : (
              <Button
                size="sm"
                variant={
                  profile.isFriend && isSubscribedHovering
                    ? "destructive"
                    : profile.isFriend
                      ? "secondary"
                      : "default"
                }
                className="w-full"
                disabled={pendingId === profile.id}
                onClick={() => handleToggleFriend(profile.id, profile.isFriend)}
                onMouseEnter={() => {
                  if (profile.isFriend) {
                    setIsSubscribedHovering(true);
                  }
                }}
                onMouseLeave={() => setIsSubscribedHovering(false)}
              >
                {pendingId === profile.id
                  ? profile.isFriend
                    ? "취소 중..."
                    : "추가 중..."
                  : profile.isFriend
                    ? isSubscribedHovering
                      ? "구독 취소"
                      : "구독중"
                    : "구독하기"}
              </Button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
