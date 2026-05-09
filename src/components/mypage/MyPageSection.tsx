"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import MyCommentsSection from "./sections/MyCommentsSection";
import MyFriendsSection from "./sections/MyFriendsSection";
import MyPostsSection from "./sections/MyPostsSection";
import MyQnaSection from "./sections/MyQnaSection";

export default function MyPageSection() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const isCategoryView = Boolean(searchParams.get("category")?.trim());

  const postsRef = useRef<HTMLDivElement>(null);
  const qnaRef = useRef<HTMLDivElement>(null);
  const commentsRef = useRef<HTMLDivElement>(null);
  const friendsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const targetRef =
      tab === "posts"
        ? postsRef
        : tab === "qna"
          ? qnaRef
          : tab === "comments"
            ? commentsRef
            : tab === "friends"
              ? friendsRef
              : null;

    if (!targetRef?.current) return;

    const scrollToSection = () => {
      targetRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    };

    scrollToSection();

    const retryDelays = [150, 350, 700];
    const timeoutIds = retryDelays.map((delay) =>
      window.setTimeout(scrollToSection, delay),
    );

    return () => {
      timeoutIds.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
    };
  }, [tab]);

  return (
    <section className="space-y-16">
      <div ref={postsRef}>
        <MyPostsSection />
      </div>

      {isCategoryView ? null : (
        <>
          <div ref={qnaRef}>
            <MyQnaSection />
          </div>

          <div ref={commentsRef}>
            <MyCommentsSection />
          </div>

          <div ref={friendsRef}>
            <MyFriendsSection />
          </div>
        </>
      )}
    </section>
  );
}
