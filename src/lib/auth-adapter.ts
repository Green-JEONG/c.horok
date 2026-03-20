import type {
  Adapter,
  AdapterUser,
  VerificationToken,
} from "next-auth/adapters";
import { prisma } from "@/lib/prisma";

type AuthUserRecord = {
  id: bigint;
  email: string;
  name: string | null;
  image: string | null;
  oauthImage: string | null;
  role: "USER" | "ADMIN";
  provider: "credentials" | "github" | "google";
};

let verificationTokenTablePromise: Promise<void> | null = null;

function mapAuthUser(user: AuthUserRecord): AdapterUser {
  return {
    id: user.id.toString(),
    email: user.email,
    emailVerified: null,
    name: user.name,
    image: user.image ?? user.oauthImage,
    role: user.role,
    provider: user.provider,
    oauthImage: user.oauthImage,
  };
}

async function ensureVerificationTokenTable() {
  if (!verificationTokenTablePromise) {
    verificationTokenTablePromise = prisma
      .$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS verification_tokens (
          identifier VARCHAR(255) NOT NULL,
          token VARCHAR(255) NOT NULL,
          expires TIMESTAMPTZ NOT NULL,
          PRIMARY KEY (identifier, token)
        )
      `)
      .then(() => undefined);
  }

  return verificationTokenTablePromise;
}

export const authAdapter: Adapter = {
  async createUser(data) {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name ?? null,
        image: data.image ?? null,
        oauthImage: data.image ?? null,
        provider: "credentials",
        role: "USER",
      },
    });

    return mapAuthUser(user);
  },

  async getUser(id) {
    const user = await prisma.user.findUnique({
      where: { id: BigInt(id) },
    });

    return user ? mapAuthUser(user) : null;
  },

  async getUserByEmail(email) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    return user ? mapAuthUser(user) : null;
  },

  async getUserByAccount({ provider, providerAccountId }) {
    if (provider !== "github" && provider !== "google") {
      return null;
    }

    const user = await prisma.user.findFirst({
      where: {
        provider,
        snsId: providerAccountId,
      },
    });

    return user ? mapAuthUser(user) : null;
  },

  async updateUser(data) {
    const user = await prisma.user.update({
      where: { id: BigInt(data.id) },
      data: {
        email: data.email,
        name: data.name,
        image: data.image,
      },
    });

    return mapAuthUser(user);
  },

  async linkAccount(account) {
    const userId = BigInt(account.userId);
    const provider =
      account.provider === "github" || account.provider === "google"
        ? account.provider
        : null;

    if (provider) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          provider,
          snsId: account.providerAccountId,
        },
      });
    }

    return account;
  },

  async createVerificationToken(data) {
    await ensureVerificationTokenTable();

    await prisma.$executeRaw`
      INSERT INTO verification_tokens (identifier, token, expires)
      VALUES (${data.identifier}, ${data.token}, ${data.expires})
    `;

    return data;
  },

  async useVerificationToken(params) {
    await ensureVerificationTokenTable();

    return prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<VerificationToken[]>`
        SELECT identifier, token, expires
        FROM verification_tokens
        WHERE identifier = ${params.identifier}
          AND token = ${params.token}
        LIMIT 1
      `;

      const token = rows[0] ?? null;
      if (!token) {
        return null;
      }

      await tx.$executeRaw`
        DELETE FROM verification_tokens
        WHERE identifier = ${params.identifier}
          AND token = ${params.token}
      `;

      return token;
    });
  },
};
