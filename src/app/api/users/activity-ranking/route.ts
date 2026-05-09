import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rows = await prisma.post.groupBy({
      by: ["userId"],
      where: {
        isDeleted: false,
        isHidden: false,
        isSecret: false,
        user: {
          is: {
            isBlocked: false,
          },
        },
        category: {
          is: {
            name: {
              notIn: ["FAQ", "QnA"],
            },
          },
        },
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _count: {
          userId: "desc",
        },
      },
      take: 3,
    });

    const userIds = rows.map((row) => row.userId);
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        id: true,
        name: true,
        image: true,
      },
    });
    const userMap = new Map(users.map((user) => [user.id.toString(), user]));

    return NextResponse.json(
      rows
        .map((row, index) => {
          const user = userMap.get(row.userId.toString());

          if (!user) {
            return null;
          }

          return {
            rank: index + 1,
            userId: Number(user.id),
            name: user.name,
            image: user.image,
            postCount: row._count._all,
          };
        })
        .filter((row) => row !== null),
    );
  } catch (error) {
    console.error("ACTIVITY RANKING API ERROR:", error);
    return NextResponse.json([], { status: 500 });
  }
}
