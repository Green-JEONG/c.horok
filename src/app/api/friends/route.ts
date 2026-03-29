import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

async function getFriendUserId(req: Request) {
  const body = await req.json().catch(() => null);
  const friendUserId =
    typeof body?.friendUserId === "number" ||
    typeof body?.friendUserId === "string"
      ? String(body.friendUserId)
      : null;

  return friendUserId && /^\d+$/.test(friendUserId) ? friendUserId : null;
}

async function getSessionUserId() {
  const session = await auth();

  if (!session?.user?.id || !/^\d+$/.test(session.user.id)) {
    return null;
  }

  return session.user.id;
}

export async function POST(req: Request) {
  try {
    const sessionUserId = await getSessionUserId();
    if (!sessionUserId) {
      return NextResponse.json(
        { message: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    const friendUserId = await getFriendUserId(req);
    if (!friendUserId) {
      return NextResponse.json(
        { message: "올바른 유저 정보가 아닙니다." },
        { status: 400 },
      );
    }

    if (friendUserId === sessionUserId) {
      return NextResponse.json(
        { message: "본인은 추가할 수 없습니다." },
        { status: 400 },
      );
    }

    const userId = BigInt(sessionUserId);
    const targetUserId = BigInt(friendUserId);

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { message: "사용자를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const existingFriend = await prisma.friend.findUnique({
      where: {
        userId_friendUserId: {
          userId,
          friendUserId: targetUserId,
        },
      },
      select: {
        id: true,
      },
    });

    await prisma.friend.upsert({
      where: {
        userId_friendUserId: {
          userId,
          friendUserId: targetUserId,
        },
      },
      update: {},
      create: {
        userId,
        friendUserId: targetUserId,
      },
    });

    if (!existingFriend && userId !== targetUserId) {
      try {
        await prisma.notification.create({
          data: {
            userId: targetUserId,
            actorId: userId,
            type: "NEW_FOLLOWER",
            content: "나를 구독한 유저가 있어요",
          },
        });
      } catch (error) {
        console.error("FOLLOW NOTIFICATION CREATE ERROR:", error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("FRIENDS POST API ERROR:", error);
    return NextResponse.json(
      { message: "친구 추가에 실패했습니다." },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const sessionUserId = await getSessionUserId();
    if (!sessionUserId) {
      return NextResponse.json(
        { message: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    const friendUserId = await getFriendUserId(req);
    if (!friendUserId) {
      return NextResponse.json(
        { message: "올바른 유저 정보가 아닙니다." },
        { status: 400 },
      );
    }

    await prisma.friend.deleteMany({
      where: {
        userId: BigInt(sessionUserId),
        friendUserId: BigInt(friendUserId),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("FRIENDS DELETE API ERROR:", error);
    return NextResponse.json(
      { message: "친구 삭제에 실패했습니다." },
      { status: 500 },
    );
  }
}
