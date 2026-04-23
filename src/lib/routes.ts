type TechPostSection = "feeds" | "likes";

export function getTechPostPath(
  section: TechPostSection,
  postId: number | string,
) {
  return `/horok-tech/${section}/posts/${postId}`;
}

export function getTechFeedPostPath(postId: number | string) {
  return getTechPostPath("feeds", postId);
}

export function getTechLikesPostPath(postId: number | string) {
  return getTechPostPath("likes", postId);
}

export function getTechFeedNewPostPath() {
  return "/horok-tech/feeds/posts/new";
}

export function getTechNoticePath(postId: number | string) {
  return `/horok-tech/notices/${postId}`;
}
