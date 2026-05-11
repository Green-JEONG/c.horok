export type PostDraftPayload = {
  id?: string;
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

export function getTechPostDraftStorageKey() {
  return getPostDraftStorageKey({
    successPathPrefix: "/horok-tech/feeds/posts",
    fixedTagOptions: [],
    categoryLocked: false,
  });
}

function getPostDraftListStorageKey(storageKey: string) {
  return `${storageKey}:list`;
}

function normalizeDraft(draft: PostDraftPayload): PostDraftPayload {
  return {
    ...draft,
    id:
      draft.id ??
      `draft-${Date.parse(draft.savedAt) || Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
  };
}

export function loadPostDrafts(storageKey: string) {
  if (typeof window === "undefined") {
    return [];
  }

  const listStorageKey = getPostDraftListStorageKey(storageKey);
  const rawListValue = window.localStorage.getItem(listStorageKey);
  const rawLegacyValue = window.localStorage.getItem(storageKey);
  const drafts: PostDraftPayload[] = [];

  if (rawListValue) {
    try {
      const parsedValue = JSON.parse(rawListValue);
      if (Array.isArray(parsedValue)) {
        drafts.push(
          ...parsedValue
            .filter((draft): draft is PostDraftPayload => Boolean(draft))
            .map(normalizeDraft),
        );
      }
    } catch {
      window.localStorage.removeItem(listStorageKey);
    }
  }

  if (rawLegacyValue) {
    try {
      const legacyDraft = normalizeDraft(
        JSON.parse(rawLegacyValue) as PostDraftPayload,
      );
      if (!drafts.some((draft) => draft.id === legacyDraft.id)) {
        drafts.push(legacyDraft);
      }
      window.localStorage.removeItem(storageKey);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }

  const sortedDrafts = drafts.sort(
    (a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt),
  );

  window.localStorage.setItem(listStorageKey, JSON.stringify(sortedDrafts));

  return sortedDrafts;
}

export function loadPostDraft(storageKey: string, draftId?: string | null) {
  const drafts = loadPostDrafts(storageKey);

  if (draftId) {
    return drafts.find((draft) => draft.id === draftId) ?? null;
  }

  return drafts[0] ?? null;
}

export function hasPostDraft(storageKey: string) {
  return loadPostDrafts(storageKey).length > 0;
}

export function countPostDrafts(storageKey: string) {
  return loadPostDrafts(storageKey).length;
}

export function savePostDraft(storageKey: string, payload: PostDraftPayload) {
  if (typeof window === "undefined") {
    return null;
  }

  const nextDraft = normalizeDraft(payload);
  const drafts = loadPostDrafts(storageKey);
  const nextDrafts = [
    nextDraft,
    ...drafts.filter((draft) => draft.id !== nextDraft.id),
  ].sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt));

  window.localStorage.setItem(
    getPostDraftListStorageKey(storageKey),
    JSON.stringify(nextDrafts),
  );

  return nextDraft;
}

export function clearPostDraft(storageKey: string, draftId?: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!draftId) {
    window.localStorage.removeItem(storageKey);
    window.localStorage.removeItem(getPostDraftListStorageKey(storageKey));
    return;
  }

  const nextDrafts = loadPostDrafts(storageKey).filter(
    (draft) => draft.id !== draftId,
  );

  window.localStorage.setItem(
    getPostDraftListStorageKey(storageKey),
    JSON.stringify(nextDrafts),
  );
}
