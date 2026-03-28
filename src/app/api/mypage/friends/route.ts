import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json([]);
    }

    const rows = await prisma.friend.findMany({
      where: {
        userId: BigInt(session.user.id),
      },
      orderBy: { createdAt: "desc" },
      include: {
        friendUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(
      rows.map((row) => ({
        id: Number(row.friendUser.id),
        name: row.friendUser.name,
        email: row.friendUser.email,
        image: row.friendUser.image,
      })),
    );
  } catch (e) {
    console.error("FRIENDS API ERROR:", e);
    return NextResponse.json([], { status: 500 });
  }
}
