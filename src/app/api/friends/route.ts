import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id || !/^\d+$/.test(session.user.id)) {
      return NextResponse.json(
        { message: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => null);
    const friendUserId =
      typeof body?.friendUserId === "number" ||
      typeof body?.friendUserId === "string"
        ? String(body.friendUserId)
        : null;

    if (!friendUserId || !/^\d+$/.test(friendUserId)) {
      return NextResponse.json(
        { message: "올바른 유저 정보가 아닙니다." },
        { status: 400 },
      );
    }

    if (friendUserId === session.user.id) {
      return NextResponse.json(
        { message: "본인은 추가할 수 없습니다." },
        { status: 400 },
      );
    }

    const userId = BigInt(session.user.id);
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("FRIENDS POST API ERROR:", error);
    return NextResponse.json(
      { message: "친구 추가에 실패했습니다." },
      { status: 500 },
    );
  }
}
