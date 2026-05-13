const EXCERPT_MAX_LENGTH = 36;
const TITLE_MAX_LENGTH = 32;

function compactText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncate(value: string, maxLength: number) {
  const compacted = compactText(value);
  const characters = Array.from(compacted);

  if (characters.length <= maxLength) {
    return compacted;
  }

  return `${characters.slice(0, maxLength).join("")}...`;
}

export function formatNotificationActorName(name?: string | null) {
  return compactText(name ?? "") || "누군가";
}

export function formatNotificationQuote(
  value: string,
  maxLength = EXCERPT_MAX_LENGTH,
) {
  return `"${truncate(value, maxLength)}"`;
}

export function formatNotificationPostTitle(title: string) {
  return `'${truncate(title, TITLE_MAX_LENGTH)}'`;
}

export function createCommentNotificationMessage(params: {
  actorName?: string | null;
  content: string;
  postTitle?: string | null;
  isReply?: boolean;
  isAnswer?: boolean;
}) {
  const actorName = formatNotificationActorName(params.actorName);
  const quote = formatNotificationQuote(params.content);
  const postTitle = params.postTitle
    ? `${formatNotificationPostTitle(params.postTitle)} 게시글에 `
    : "";

  if (params.isReply) {
    return `${actorName}님이 ${postTitle}${quote} 답글을 달았습니다.`;
  }

  if (params.isAnswer) {
    return `${actorName}님이 ${postTitle}${quote} 답변을 달았습니다.`;
  }

  return `${actorName}님이 ${postTitle}${quote} 댓글을 달았습니다.`;
}

export function createPostBookmarkNotificationMessage(params: {
  actorName?: string | null;
  postTitle: string;
}) {
  return `${formatNotificationActorName(params.actorName)}님이 ${formatNotificationPostTitle(
    params.postTitle,
  )} 게시글을 북마크했습니다.`;
}

export function createNewPostNotificationMessage(params: {
  actorName?: string | null;
  postTitle: string;
}) {
  return `${formatNotificationActorName(params.actorName)}님이 ${formatNotificationPostTitle(
    params.postTitle,
  )} 게시글을 작성했습니다.`;
}

export function createNewInquiryNotificationMessage(params: {
  actorName?: string | null;
  postTitle?: string | null;
}) {
  const postTitle = params.postTitle
    ? `${formatNotificationPostTitle(params.postTitle)} 문의를`
    : "새로운 문의를";

  return `${formatNotificationActorName(params.actorName)}님이 ${postTitle} 등록했어요.`;
}

export function createPostReactionNotificationMessage(params: {
  actorName?: string | null;
  postTitle: string;
  emoji: string;
}) {
  return `${formatNotificationActorName(params.actorName)}님이 ${formatNotificationPostTitle(
    params.postTitle,
  )} 게시글에 ${params.emoji} 반응했습니다.`;
}

export function createCommentReactionNotificationMessage(params: {
  actorName?: string | null;
  commentContent: string;
  emoji: string;
}) {
  return `${formatNotificationActorName(params.actorName)}님이 ${formatNotificationQuote(
    params.commentContent,
  )} 댓글에 ${params.emoji} 반응했습니다.`;
}

export function createFollowerNotificationMessage(params: {
  actorName?: string | null;
}) {
  return `${formatNotificationActorName(params.actorName)}님이 나를 팔로잉 했습니다.`;
}
