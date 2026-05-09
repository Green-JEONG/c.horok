export type PostDraftPayload = {
  title: string;
  content: string;
  tags: string[];
  selectedFixedTag: string;
  thumbnailUrl?: string | null;
  isBanner: boolean;
  isSecret: boolean;
  savedAt: string;
};

export function getPostDraftStorageKey(params: {
  successPathPrefix: string;
  fixedTagOptions: string[];
  categoryLocked: boolean;
}) {
  const { successPathPrefix, fixedTagOptions, categoryLocked } = params;

  return `post-editor-draft:${successPathPrefix}:${fixedTagOptions.join(",")}:${categoryLocked ? "locked" : "free"}`;
}

export function loadPostDraft(storageKey: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(storageKey);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as PostDraftPayload;
  } catch {
    window.localStorage.removeItem(storageKey);
    return null;
  }
}

export function savePostDraft(storageKey: string, payload: PostDraftPayload) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(payload));
}

export function clearPostDraft(storageKey: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(storageKey);
}
