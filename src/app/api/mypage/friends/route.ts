import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

function serializeUser(user: {
  id: bigint;
  name: string | null;
  email: string;
  image: string | null;
  _count: { followers: number };
}) {
  return {
    id: Number(user.id),
    name: user.name,
    email: user.email,
    image: user.image,
    followerCount: user._count.followers,
  };
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ followers: [], following: [] });
    }

    const userId = BigInt(session.user.id);

    const [followersRows, followingRows] = await Promise.all([
      prisma.friend.findMany({
        where: {
          friendUserId: userId,
        },
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              _count: {
                select: {
                  followers: true,
                },
              },
            },
          },
        },
      }),
      prisma.friend.findMany({
        where: {
          userId,
        },
        orderBy: { createdAt: "desc" },
        include: {
          friendUser: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              _count: {
                select: {
                  followers: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      followers: followersRows.map((row) => serializeUser(row.user)),
      following: followingRows.map((row) => serializeUser(row.friendUser)),
    });
  } catch (e) {
    console.error("FRIENDS API ERROR:", e);
    return NextResponse.json({ followers: [], following: [] }, { status: 500 });
  }
}
