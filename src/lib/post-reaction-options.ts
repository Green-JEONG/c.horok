export const POST_REACTION_EMOJIS = [
  "👀",
  "👍",
  "👎",
  "🎉",
  "😊",
  "😂",
  "😭",
  "💡",
] as const;

export type PostReactionEmoji = (typeof POST_REACTION_EMOJIS)[number];

export type PostReactionSummary = {
  emoji: PostReactionEmoji;
  count: number;
  reacted: boolean;
};

export function isPostReactionEmoji(
  value: unknown,
): value is PostReactionEmoji {
  return (
    typeof value === "string" &&
    POST_REACTION_EMOJIS.includes(value as PostReactionEmoji)
  );
}
