"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

import MyCommentsSection from "./sections/MyCommentsSection";
import MyFriendsSection from "./sections/MyFriendsSection";
import MyPostsSection from "./sections/MyPostsSection";

export default function MyPageSection() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  const postsRef = useRef<HTMLDivElement>(null);
  const commentsRef = useRef<HTMLDivElement>(null);
  const friendsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tab === "posts") {
      postsRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    if (tab === "comments") {
      commentsRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    if (tab === "friends") {
      friendsRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [tab]);

  return (
    <section className="space-y-16">
      <div ref={postsRef}>
        <MyPostsSection />
      </div>

      <div ref={commentsRef}>
        <MyCommentsSection />
      </div>

      <div ref={friendsRef}>
        <MyFriendsSection />
      </div>
    </section>
  );
}
