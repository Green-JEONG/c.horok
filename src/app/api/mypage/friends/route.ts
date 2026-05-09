import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { countVisibleUserPosts } from "@/lib/queries";

async function serializeUser(
  user: {
    id: bigint;
    name: string | null;
    email: string;
    image: string | null;
    _count: { followers: number };
  },
  viewerUserId: number,
) {
  const userId = Number(user.id);

  return {
    id: userId,
    name: user.name,
    email: user.email,
    image: user.image,
    followerCount: user._count.followers,
    postCount: await countVisibleUserPosts(userId, viewerUserId),
  };
}

type FriendUser = {
  id: bigint;
  name: string | null;
  email: string;
  image: string | null;
  _count: { followers: number };
};

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ followers: [], following: [] });
    }

    const userId = BigInt(session.user.id);
    const viewerUserId = Number(session.user.id);

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

    const [followers, following] = await Promise.all([
      Promise.all(
        followersRows.map((row) =>
          serializeUser(row.user as FriendUser, viewerUserId),
        ),
      ),
      Promise.all(
        followingRows.map((row) =>
          serializeUser(row.friendUser as FriendUser, viewerUserId),
        ),
      ),
    ]);

    return NextResponse.json({ followers, following });
  } catch (e) {
    console.error("FRIENDS API ERROR:", e);
    return NextResponse.json({ followers: [], following: [] }, { status: 500 });
  }
}
