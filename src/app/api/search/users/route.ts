import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { searchUsersByName } from "@/lib/queries";
import { parseUserSearchSort } from "@/lib/user-search-sort";

export async function GET(req: Request) {
  const session = await auth();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const userSort = parseUserSearchSort(searchParams.get("userSort"));

  if (!q.trim() || page < 1) {
    return NextResponse.json([]);
  }

  const limit = 12;
  const offset = (page - 1) * limit;

  const users = await searchUsersByName(
    q,
    limit,
    userSort,
    typeof session?.user?.id === "string" ? Number(session.user.id) : null,
    offset,
  );

  return NextResponse.json(users);
}
