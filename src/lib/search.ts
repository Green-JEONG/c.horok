const MIN_SEARCH_TOKEN_LENGTH = 2;

export function normalizeSearchText(raw: string) {
  return raw
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizeSearchQuery(raw: string) {
  return normalizeSearchText(raw)
    .split(" ")
    .filter((word) => word.length >= MIN_SEARCH_TOKEN_LENGTH);
}
