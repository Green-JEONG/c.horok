"use client";

import { signOut } from "next-auth/react";
import Image from "next/image";
import { Circle, CircleCheckBig, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import AccountSettingsModal from "@/components/mypage/AccountSettingsModal";
import { useRouter } from "next/navigation";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function MyPageDrawer({ open, onClose }: Props) {
  const { data: session } = useSession();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const router = useRouter();

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* dim + blur */}
      <button
        type="button"
        aria-label="마이페이지 닫기"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 cursor-default"
      />

      {/* drawer */}
      <aside className="absolute left-0 top-0 h-full w-87.5 bg-background text-foreground shadow-xl flex flex-col">
        {/* header */}
        <div className="flex items-center justify-end p-4">
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
        <div className="px-4 pt-4 flex flex-col items-center gap-3">
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

        {/* 글, 댓글, 친구 갯수 */}
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
            <p className="font-extrabold text-white">3</p>
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
            <p className="font-extrabold text-white">3</p>
          </button>
          <button
            type="button"
            className="bg-primary text-primary-foreground shadow-sm border border-border rounded-lg w-full py-2 my-6"
            onClick={() => {
              onClose();
              router.push("/mypage?tab=friends");
            }}
          >
            <p className="font-light text-white">친구</p>
            <p className="font-extrabold text-white">3</p>
          </button>
        </div>

        {/* notifications */}
        <div className="flex-1 overflow-y-auto p-6 mx-4 border border-border shadow-md rounded-3xl bg-muted text-foreground">
          <h3 className="mb-5 text-xl font-semibold">알림</h3>

          <ul className="flex flex-col text-sm gap-2">
            <li className="flex items-center gap-2">
              <Circle color="#ccc" width={20} /> 회원가입이 완료되었습니다
            </li>
            <li className="flex items-center gap-2">
              <CircleCheckBig color="#4CB975" width={20} /> 도롱이 팀 요청 승인
            </li>
            <li className="flex items-center gap-2">
              <CircleCheckBig color="#4CB975" width={20} /> 새로운 댓글이
              달렸어요
            </li>
          </ul>
        </div>

        <p className="text-center text-xs font-light my-4 text-muted-foreground">
          Developed by{" "}
          <a
            href="https://github.com/Green-JEONG/hanaro"
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
