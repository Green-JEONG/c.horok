import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getUserIdByEmail } from "@/lib/db";
import {
  deletePostDraftsForUser,
  getPostDraftsByUser,
  upsertPostDraftForUser,
} from "@/lib/post-draft-store";
import type { PostDraftPayload } from "@/lib/post-drafts";

function getStorageKey(request: Request) {
  const storageKey = new URL(request.url).searchParams
    .get("storageKey")
    ?.trim();

  return storageKey && storageKey.length <= 255 ? storageKey : null;
}

async function getSessionUserId() {
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  return getUserIdByEmail(session.user.email);
}

export async function GET(request: Request) {
  const storageKey = getStorageKey(request);
  const userId = await getSessionUserId();

  if (!storageKey) {
    return NextResponse.json(
      { message: "Invalid storage key" },
      { status: 400 },
    );
  }

  if (!userId) {
    return NextResponse.json({ drafts: [] }, { status: 401 });
  }

  const drafts = await getPostDraftsByUser({ userId, storageKey });

  return NextResponse.json({ drafts });
}

export async function POST(request: Request) {
  const storageKey = getStorageKey(request);
  const userId = await getSessionUserId();

  if (!storageKey) {
    return NextResponse.json(
      { message: "Invalid storage key" },
      { status: 400 },
    );
  }

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as {
    draft?: PostDraftPayload;
  } | null;

  if (!payload?.draft) {
    return NextResponse.json({ message: "Invalid draft" }, { status: 400 });
  }

  const draft = await upsertPostDraftForUser({
    userId,
    storageKey,
    draft: payload.draft,
  });

  return NextResponse.json({ draft });
}

export async function DELETE(request: Request) {
  const storageKey = getStorageKey(request);
  const userId = await getSessionUserId();
  const draftId = new URL(request.url).searchParams.get("draftId")?.trim();

  if (!storageKey) {
    return NextResponse.json(
      { message: "Invalid storage key" },
      { status: 400 },
    );
  }

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await deletePostDraftsForUser({
    userId,
    storageKey,
    draftId: draftId || null,
  });

  return NextResponse.json({ ok: true });
}
