import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { coteAuth } from "@/app/api/cote-auth/[...nextauth]/route";
import { getUserIdByEmail } from "@/lib/db";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get("platform") === "cote" ? "cote" : "tech";
    const session = await (platform === "cote" ? coteAuth() : auth());

    if (!session?.user?.email) {
      return NextResponse.json({ first: 0, second: 0, third: 0 });
    }

    const userId = await getUserIdByEmail(session.user.email);
    if (!userId) {
      return NextResponse.json({ first: 0, second: 0, third: 0 });
    }

    if (platform === "cote") {
      const [first, second, third] = await Promise.all([
        prisma.coteProblemProgress.count({
          where: {
            userId: BigInt(userId),
            status: "solved",
          },
        }),
        prisma.coteSubmission.count({
          where: {
            userId: BigInt(userId),
          },
        }),
        prisma.coteSavedCode.count({
          where: {
            userId: BigInt(userId),
          },
        }),
      ]);

      return NextResponse.json({ first, second, third });
    }

    const [first, second, third] = await Promise.all([
      prisma.post.count({
        where: {
          userId: BigInt(userId),
          isDeleted: false,
        },
      }),
      prisma.comment.count({
        where: {
          userId: BigInt(userId),
          isDeleted: false,
        },
      }),
      prisma.friend.count({
        where: {
          userId: BigInt(userId),
        },
      }),
    ]);

    return NextResponse.json({ first, second, third });
  } catch (e) {
    console.error("MYPAGE STATS API ERROR:", e);
    return NextResponse.json({ first: 0, second: 0, third: 0 });
  }
}
