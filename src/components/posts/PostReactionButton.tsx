"use client";

import { SmilePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  POST_REACTION_EMOJIS,
  type PostReactionSummary,
} from "@/lib/post-reaction-options";

type Props = {
  postId: number;
  initialReactions: PostReactionSummary[];
  disabled?: boolean;
  markCheckingOnAdminReaction?: boolean;
};

function normalizeReactions(reactions: PostReactionSummary[]) {
  const reactionByEmoji = new Map<string, PostReactionSummary>();

  for (const reaction of reactions) {
    const current = reactionByEmoji.get(reaction.emoji);

    reactionByEmoji.set(reaction.emoji, {
      emoji: reaction.emoji,
      count: Math.max(current?.count ?? 0, reaction.count),
      reacted: Boolean(current?.reacted || reaction.reacted),
    });
  }

  return Array.from(reactionByEmoji.values());
}

export default function PostReactionButton({
  postId,
  initialReactions,
  disabled = false,
  markCheckingOnAdminReaction = false,
}: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reactions, setReactions] = useState(() =>
    normalizeReactions(initialReactions),
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  async function toggleReaction(emoji: string) {
    if (disabled || isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/posts/${postId}/reactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emoji }),
      });
      const payload = await response.json().catch(() => null);

      if (response.ok && Array.isArray(payload?.reactions)) {
        setReactions(normalizeReactions(payload.reactions));

        if (markCheckingOnAdminReaction && payload.reacted) {
          await fetch(`/api/posts/${postId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ inquiryStatus: "checking" }),
          });
        }

        if (markCheckingOnAdminReaction) {
          router.refresh();
        }
      }
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative flex items-center gap-1.5">
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          type="button"
          disabled={disabled || isLoading}
          onClick={() => toggleReaction(reaction.emoji)}
          className={`inline-flex h-8 items-center gap-1 rounded-full border px-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            reaction.reacted
              ? "border-primary bg-primary/10 text-foreground"
              : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
          aria-pressed={reaction.reacted}
          aria-label={`${reaction.emoji} 반응 ${reaction.count}`}
        >
          <span>{reaction.emoji}</span>
          <span className="text-xs font-semibold">{reaction.count}</span>
        </button>
      ))}

      <div className="relative inline-flex">
        <button
          type="button"
          disabled={disabled || isLoading}
          onClick={() => setIsOpen((current) => !current)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="이모티콘 반응 선택"
          aria-expanded={isOpen}
        >
          <SmilePlus className="h-4.5 w-4.5" />
        </button>

        {isOpen ? (
          <div className="absolute left-0 top-full z-50 mt-3 flex max-w-[calc(100vw-2rem)] items-center gap-4 overflow-x-auto rounded-md border border-border bg-background px-4 py-3 shadow-[0_12px_28px_rgba(0,0,0,0.18)] dark:bg-zinc-950">
            {POST_REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                disabled={isLoading}
                onClick={() => toggleReaction(emoji)}
                className="text-2xl leading-none transition-transform hover:scale-125 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`${emoji} 반응`}
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
