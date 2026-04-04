"use client";

import { Circle, CircleCheckBig, Settings } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import AccountSettingsModal from "@/components/mypage/AccountSettingsModal";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
};

type Notification = {
  id: number;
  type:
    | "FRIEND_REQUEST"
    | "POST_COMMENT"
    | "COMMENT_REPLY"
    | "POST_LIKE"
    | "NEW_FOLLOWER";
  actor_name: string | null;
  message?: string | null;
  post_id: number | null;
  comment_id: number | null;
  is_post_deleted: boolean;
  is_read: number;
  created_at: string;
};

const NOTIFICATIONS_UPDATED_EVENT = "notifications-updated";
const DRAWER_TRANSITION_MS = 300;

function renderNotificationMessage(n: Notification) {
  if (n.is_post_deleted) return "삭제된 게시물입니다";
  if (n.message) return n.message;

  switch (n.type) {
    case "FRIEND_REQUEST":
      return `${n.actor_name ?? "누군가"}님이 친구 요청을 보냈습니다`;
    case "POST_COMMENT":
      return `${n.actor_name ?? "누군가"}님이 내 게시물에 댓글을 남겼습니다`;
    case "COMMENT_REPLY":
      return `${n.actor_name ?? "누군가"}님이 내 댓글에 답글을 남겼습니다`;
    case "POST_LIKE":
      return `${n.actor_name ?? "누군가"}님이 내 게시물을 좋아합니다`;
    case "NEW_FOLLOWER":
      return `${n.actor_name ?? "누군가"}님이 나를 구독했습니다`;
    default:
      return "새 알림이 있습니다";
  }
}

export default function MyPageDrawer({ open, onClose }: Props) {
  const { data: session } = useSession();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(open);
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState({
    posts: 0,
    comments: 0,
    friends: 0,
  });

  const notifyNotificationsUpdated = () => {
    window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
  };

  // ESC 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // 드로어가 닫히면 설정 모달도 닫기(자연스럽게)
  useEffect(() => {
    if (!open) setSettingsOpen(false);
  }, [open]);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsVisible(false);
    }, DRAWER_TRANSITION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const loadNotifications = async () => {
      try {
        const res = await fetch("/api/notifications");

        console.log("🔔 응답 상태:", res.status);

        if (!res.ok) {
          console.error("알림 API 실패", res.status);
          setNotifications([]);
          return;
        }

        const text = await res.text();

        if (!text) {
          console.warn("⚠️ 알림 응답 바디 비어있음");
          setNotifications([]);
          return;
        }

        const data = JSON.parse(text);
        console.log("🔔 알림 데이터:", data);
        setNotifications(data);
      } catch (e) {
        console.error("알림 로드 실패", e);
        setNotifications([]);
      }
    };

    loadNotifications();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const loadStats = async () => {
      try {
        const res = await fetch("/api/mypage/stats");
        if (!res.ok) return;

        const data = await res.json();
        setStats(data);
      } catch (e) {
        console.error("stats 로드 실패", e);
      }
    };

    loadStats();
  }, [open]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[80]",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
    >
      {/* dim + blur */}
      <button
        type="button"
        aria-label="마이페이지 닫기"
        onClick={onClose}
        className={cn(
          "absolute inset-0 cursor-pointer bg-black/50 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
      />

      <aside
        className={cn(
          "absolute left-0 top-0 flex h-full w-87.5 flex-col bg-background text-foreground shadow-xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between p-4">
          <nav className="flex items-center gap-4 text-sm">
            {session?.user?.role === "ADMIN" && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push("/admin");
                }}
                className="text-red-500 font-semibold hover:underline"
              >
                관리자
              </button>
            )}
          </nav>
          <button
            type="button"
            aria-label="설정 열기"
            onClick={() => setSettingsOpen(true)}
            className="rounded-md p-2 hover:bg-muted"
          >
            <Settings size={18} />
          </button>
        </div>

        {/* profile */}
        <div className="px-4 flex flex-col items-center gap-3">
          <Image
            src={session?.user?.image ?? "/logo.svg"}
            alt="profile"
            width={100}
            height={100}
            className="rounded-full border"
            style={{ width: "auto", height: "auto" }}
          />
          <div className="flex flex-col items-center">
            <p className="text-2xl font-semibold text-foreground">
              {session?.user?.name ?? "사용자"}
            </p>
            <p className="text-xs text-muted-foreground">
              {session?.user?.email}
            </p>
          </div>
        </div>

        {/* 글, 댓글, 구독 갯수 */}
        <div className="flex justify-around mx-4 gap-2 items-center">
          <button
            type="button"
            className="bg-primary text-primary-foreground shadow-sm border border-border rounded-lg w-full py-2 my-6"
            onClick={() => {
              onClose();
              router.push("/mypage?tab=posts");
            }}
          >
            <p className="font-light text-white">글</p>
            <p className="font-extrabold text-white">{stats.posts}</p>
          </button>
          <button
            type="button"
            className="bg-primary text-primary-foreground shadow-sm border border-border rounded-lg w-full py-2 my-6"
            onClick={() => {
              onClose();
              router.push("/mypage?tab=comments");
            }}
          >
            <p className="font-light text-white">댓글</p>
            <p className="font-extrabold text-white">{stats.comments}</p>
          </button>
          <button
            type="button"
            className="bg-primary text-primary-foreground shadow-sm border border-border rounded-lg w-full py-2 my-6"
            onClick={() => {
              onClose();
              router.push("/mypage?tab=friends");
            }}
          >
            <p className="font-light text-white">구독</p>
            <p className="font-extrabold text-white">{stats.friends}</p>
          </button>
        </div>

        {/* notifications */}
        <div className="flex-1 overflow-y-auto p-6 mx-4 border border-border shadow-md rounded-3xl bg-muted text-foreground">
          <h3 className="mb-5 text-xl font-semibold">알림</h3>

          <ul className="flex flex-col text-sm gap-3">
            {notifications.length === 0 && (
              <li className="text-muted-foreground">알림이 없습니다.</li>
            )}

            <ul className="flex flex-col gap-2">
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 text-left hover:underline disabled:cursor-default disabled:no-underline disabled:opacity-70"
                    onClick={async () => {
                      if (!n.is_read) {
                        try {
                          const response = await fetch(
                            `/api/notifications/${n.id}/read`,
                            {
                              method: "PATCH",
                            },
                          );

                          if (response.ok) {
                            setNotifications((current) =>
                              current.map((notification) =>
                                notification.id === n.id
                                  ? { ...notification, is_read: 1 }
                                  : notification,
                              ),
                            );
                            notifyNotificationsUpdated();
                          }
                        } catch (error) {
                          console.error("알림 읽음 처리 실패", error);
                        }
                      }

                      onClose();
                      if (n.type === "NEW_FOLLOWER") {
                        router.push("/mypage?tab=friends");
                        return;
                      }

                      if (n.post_id && !n.is_post_deleted) {
                        router.push(`/posts/${n.post_id}`);
                      }
                    }}
                    disabled={n.is_post_deleted}
                  >
                    {n.is_read ? (
                      <CircleCheckBig color="#4CB975" width={18} />
                    ) : (
                      <Circle color="#ccc" width={18} />
                    )}
                    {renderNotificationMessage(n)}
                  </button>
                </li>
              ))}
            </ul>
          </ul>
        </div>

        <p className="text-center text-xs font-light my-4 text-muted-foreground">
          Developed by{" "}
          <a
            href="https://github.com/Green-JEONG/horok-dev"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Green_JEONG
          </a>
        </p>

        {/* footer */}
        <div className="flex border-t border-border py-6 mx-6">
          <button
            type="button"
            className="w-full border-r text-sm text-red-400 hover:underline"
            onClick={async () => {
              const ok = confirm("정말 회원탈퇴를 하시겠습니까?");
              if (!ok) return;

              const res = await fetch("/api/user/delete", {
                method: "DELETE",
              });

              if (!res.ok) {
                alert("회원탈퇴에 실패했습니다.");
                return;
              }

              await signOut({ callbackUrl: "/" });
            }}
          >
            회원탈퇴
          </button>

          <button
            type="button"
            className="w-full rounded-md text-sm text-muted-foreground"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            로그아웃
          </button>
        </div>
      </aside>

      {/* settings modal */}
      <AccountSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
