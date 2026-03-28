import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { findUserContributions, getUserIdByEmail } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);

    const userIdParam = searchParams.get("userId");

    let userId: number | null = null;

    if (userIdParam && /^\d+$/.test(userIdParam)) {
      userId = Number(userIdParam);
    } else if (session?.user?.email) {
      userId = await getUserIdByEmail(session.user.email);
    }

    if (!userId) {
      return NextResponse.json([], { status: 200 });
    }

    const data = await findUserContributions(userId);

    return NextResponse.json(data);
  } catch (err) {
    console.error("[contributions API error]", err);
    return NextResponse.json([], { status: 200 });
  }
}
