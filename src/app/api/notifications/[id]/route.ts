import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getUserIdByEmail } from "@/lib/db";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const notificationId = Number(id);

  if (Number.isNaN(notificationId)) {
    return NextResponse.json(
      { message: "Invalid notification id" },
      { status: 400 },
    );
  }

  const userId = await getUserIdByEmail(session.user.email);

  if (!userId) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const notification = await prisma.notification.findFirst({
    where: {
      id: BigInt(notificationId),
      userId: BigInt(userId),
    },
    select: {
      id: true,
    },
  });

  if (!notification) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  await prisma.notification.delete({
    where: {
      id: BigInt(notificationId),
    },
  });

  return NextResponse.json({ ok: true });
}
