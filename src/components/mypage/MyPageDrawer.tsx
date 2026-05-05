"use client";

import { Circle, CircleCheckBig, Settings } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import AccountSettingsModal from "@/components/mypage/AccountSettingsModal";
import {
  getPlatformFromPathname,
  usePlatformProfile,
} from "@/components/mypage/usePlatformProfile";
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
  post_path: string | null;
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
  const pathname = usePathname();
  const platform = getPlatformFromPathname(pathname);
  const isCote = platform === "cote";
  const { profile, refresh } = usePlatformProfile(open);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(open);
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState({
    first: 0,
    second: 0,
    third: 0,
  });
  const getCallbackUrl = useCallback(() => {
    if (typeof window === "undefined") {
      return "/";
    }

    return `${window.location.pathname}${window.location.search}`;
  }, []);

  const notifyNotificationsUpdated = () => {
    window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
  };

  // ESC 닫기
  useEffect(() => {
    if (!open || isCote) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isCote, onClose, open]);

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
    if (!open || isCote) return;

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
  }, [isCote, open]);

  useEffect(() => {
    if (!open) return;

    const loadStats = async () => {
      try {
        const res = await fetch(`/api/mypage/stats?platform=${platform}`);
        if (!res.ok) return;

        const data = await res.json();
        setStats(data);
      } catch (e) {
        console.error("stats 로드 실패", e);
      }
    };

    loadStats();
  }, [open, platform]);

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
          "absolute left-0 top-0 flex h-full w-87.5 flex-col shadow-xl transition-transform duration-300 ease-out",
          isCote
            ? "bg-white text-slate-900 dark:bg-[#111727] dark:text-white"
            : "bg-background text-foreground",
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
            className={cn(
              "rounded-md p-2",
              isCote
                ? "hover:bg-slate-900/6 dark:hover:bg-white/10"
                : "hover:bg-muted",
            )}
          >
            <Settings size={18} />
          </button>
        </div>

        {/* profile */}
        <div className="px-4 flex flex-col items-center gap-3">
          <Image
            src={profile?.image ?? session?.user?.image ?? "/logo.svg"}
            alt="profile"
            width={100}
            height={100}
            className={cn(
              "h-[100px] w-[100px] rounded-full border p-1",
              isCote
                ? "border-slate-200 object-contain dark:border-white/15"
                : "border-border object-contain",
            )}
          />
          <div className="flex flex-col items-center">
            <p
              className={cn(
                "text-2xl font-semibold",
                isCote ? "text-slate-900 dark:text-white" : "text-foreground",
              )}
            >
              {profile?.name ?? session?.user?.name ?? "사용자"}
            </p>
            <p
              className={cn(
                "text-xs",
                isCote
                  ? "text-slate-500 dark:text-white/75"
                  : "text-muted-foreground",
              )}
            >
              {profile?.email ?? session?.user?.email}
            </p>
          </div>
        </div>

        {/* platform stats */}
        <div className="flex justify-around mx-4 gap-2 items-center">
          {[
            isCote ? "푼 문제" : "글",
            isCote ? "틀린 문제" : "댓글",
            isCote ? "즐겨 찾기" : "구독",
          ].map((label, index) => {
            const value =
              index === 0
                ? stats.first
                : index === 1
                  ? stats.second
                  : stats.third;
            const sharedClass = cn(
              "shadow-sm rounded-lg w-full py-2 my-6",
              isCote
                ? "border border-[#06923E] bg-[#06923E] text-white"
                : "bg-primary text-primary-foreground border border-border",
            );

            if (isCote) {
              return (
                <div
                  key={label}
                  className={cn(sharedClass, "flex flex-col items-center")}
                >
                  <p className="font-light text-white">{label}</p>
                  <p className="font-extrabold text-white">{value}</p>
                </div>
              );
            }

            return (
              <button
                key={label}
                type="button"
                className={sharedClass}
                onClick={() => {
                  onClose();
                  router.push(
                    index === 0
                      ? "/mypage?tab=posts"
                      : index === 1
                        ? "/mypage?tab=comments"
                        : "/mypage?tab=friends",
                  );
                }}
              >
                <p className="font-light text-white">{label}</p>
                <p className="font-extrabold text-white">{value}</p>
              </button>
            );
          })}
        </div>

        {!isCote ? (
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

                        if (n.post_path && !n.is_post_deleted) {
                          const targetPath = n.comment_id
                            ? `${n.post_path}?commentId=${n.comment_id}`
                            : n.post_path;
                          router.push(targetPath);
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
        ) : (
          <div className="flex-1" />
        )}

        <p
          className={cn(
            "text-center text-xs font-light my-4",
            isCote
              ? "text-slate-500 dark:text-white/70"
              : "text-muted-foreground",
          )}
        >
          Developed by{" "}
          <a
            href="https://github.com/Green-JEONG/horok-dev"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "underline",
              isCote
                ? "hover:text-slate-900 dark:hover:text-white"
                : "hover:text-foreground",
            )}
          >
            Green_JEONG
          </a>
        </p>

        {/* footer */}
        <div
          className={cn(
            "flex border-t py-6 mx-6",
            isCote ? "border-slate-200 dark:border-white/10" : "border-border",
          )}
        >
          <button
            type="button"
            className={cn(
              "w-full border-r text-sm hover:underline",
              isCote
                ? "border-slate-200 text-red-500 dark:border-white/10 dark:text-red-300"
                : "text-red-400",
            )}
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

              await signOut({ callbackUrl: getCallbackUrl() });
            }}
          >
            회원탈퇴
          </button>

          <button
            type="button"
            className={cn(
              "w-full rounded-md text-sm",
              isCote
                ? "text-[#06923E] dark:text-[#06923E]"
                : "text-muted-foreground",
            )}
            onClick={() => signOut({ callbackUrl: getCallbackUrl() })}
          >
            로그아웃
          </button>
        </div>
      </aside>

      {/* settings modal */}
      <AccountSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={refresh}
      />
    </div>
  );
}
