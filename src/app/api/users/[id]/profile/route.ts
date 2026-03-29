import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ message: "Invalid user id" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: BigInt(id) },
      select: {
        id: true,
        name: true,
        image: true,
        _count: {
          select: {
            followers: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const session = await auth();
    const currentUserId =
      session?.user?.id && /^\d+$/.test(session.user.id)
        ? BigInt(session.user.id)
        : null;
    const isSelf = currentUserId === user.id;

    const existingFriend = currentUserId
      ? await prisma.friend.findUnique({
          where: {
            userId_friendUserId: {
              userId: currentUserId,
              friendUserId: user.id,
            },
          },
          select: {
            id: true,
          },
        })
      : null;

    return NextResponse.json({
      id: Number(user.id),
      name: user.name,
      image: user.image,
      followerCount: user._count.followers,
      isSelf,
      isFriend: Boolean(existingFriend),
    });
  } catch (error) {
    console.error("USER PROFILE API ERROR:", error);
    return NextResponse.json(
      { message: "유저 정보를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
