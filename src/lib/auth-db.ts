import { auth } from "@/app/api/auth/[...nextauth]/route";
import { coteAuth } from "@/app/api/cote-auth/[...nextauth]/route";
import { getUserIdByEmail } from "@/lib/db";

type AuthPlatform = "tech" | "cote";

async function getSessionByPlatform(platform: AuthPlatform) {
  return platform === "cote" ? coteAuth() : auth();
}

export async function requireDbUserId(
  platform: AuthPlatform = "tech",
): Promise<number> {
  const session = await getSessionByPlatform(platform);
  if (!session?.user?.email) {
    throw new Error("Unauthenticated");
  }

  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) {
    throw new Error("User not found");
  }

  return userId;
}

export async function getDbUserIdFromSession(platform: AuthPlatform = "tech") {
  const session = await getSessionByPlatform(platform);
  if (!session?.user?.email) return null;

  return getUserIdByEmail(session.user.email);
}
