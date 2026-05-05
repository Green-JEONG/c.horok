import { auth } from "@/app/api/auth/[...nextauth]/route";
import { coteAuth } from "@/app/api/cote-auth/[...nextauth]/route";
import { getUserIdByEmail } from "@/lib/db";
import { prisma } from "@/lib/prisma";

let horokCoteSchemaPromise: Promise<void> | null = null;
let horokTechSchemaPromise: Promise<void> | null = null;

export type PlatformProfileKind = "tech" | "cote";

async function getCurrentPlatformAuthUser(platform: PlatformProfileKind) {
  const session = await (platform === "cote" ? coteAuth() : auth());

  if (!session?.user?.email) {
    return null;
  }

  const userId = await getUserIdByEmail(session.user.email);

  if (!userId) {
    return null;
  }

  return {
    userId: BigInt(userId),
    name: session.user.name ?? null,
    image: session.user.image ?? null,
    email: session.user.email ?? null,
  };
}

async function ensureHorokCoteSchema() {
  if (!horokCoteSchemaPromise) {
    horokCoteSchemaPromise = prisma
      .$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS horok_cote`)
      .then(() =>
        prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS horok_cote.members (
            id BIGSERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
            nickname VARCHAR(50),
            avatar_url VARCHAR(512),
            tier VARCHAR(30),
            rating INTEGER NOT NULL DEFAULT 0,
            solved_count INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `),
      )
      .then(() =>
        prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS horok_cote.problem_progress (
            id BIGSERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            problem_slug VARCHAR(120) NOT NULL,
            problem_number INTEGER,
            status VARCHAR(20) NOT NULL DEFAULT 'not_started',
            last_language VARCHAR(20),
            last_code TEXT,
            last_submitted_at TIMESTAMPTZ,
            solved_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (user_id, problem_slug)
          )
        `),
      )
      .then(() =>
        prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS horok_cote.submissions (
            id BIGSERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            problem_slug VARCHAR(120) NOT NULL,
            problem_number INTEGER,
            language VARCHAR(20) NOT NULL,
            source_code TEXT NOT NULL,
            output TEXT,
            expected_output TEXT,
            status VARCHAR(20) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `),
      )
      .then(() =>
        prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS horok_cote.saved_codes (
            id BIGSERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            problem_slug VARCHAR(120) NOT NULL,
            problem_number INTEGER,
            language VARCHAR(20) NOT NULL,
            source_code TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (user_id, problem_slug, language)
          )
        `),
      )
      .then(() =>
        prisma.$executeRawUnsafe(`
          ALTER TABLE horok_cote.members
          ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(512)
        `),
      )
      .then(() => undefined);
  }

  return horokCoteSchemaPromise;
}

async function ensureHorokTechSchema() {
  if (!horokTechSchemaPromise) {
    horokTechSchemaPromise = prisma
      .$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS horok_tech`)
      .then(() =>
        prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS horok_tech.members (
            id BIGSERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
            display_name VARCHAR(100),
            avatar_url VARCHAR(512),
            bio VARCHAR(255),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `),
      )
      .then(() =>
        prisma.$executeRawUnsafe(`
          ALTER TABLE horok_tech.members
          ADD COLUMN IF NOT EXISTS display_name VARCHAR(100),
          ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(512),
          ADD COLUMN IF NOT EXISTS bio VARCHAR(255)
        `),
      )
      .then(() => undefined);
  }

  return horokTechSchemaPromise;
}

export async function ensureHorokCoteMemberProfile() {
  const currentUser = await getCurrentPlatformAuthUser("cote");

  if (!currentUser) {
    return null;
  }

  await ensureHorokCoteSchema();

  const rows = await prisma.$queryRaw<Array<{ id: bigint; user_id: bigint }>>`
    INSERT INTO horok_cote.members (user_id, nickname, avatar_url)
    VALUES (${currentUser.userId}, ${currentUser.name}, ${currentUser.image})
    ON CONFLICT (user_id) DO UPDATE
    SET updated_at = NOW()
    RETURNING id, user_id
  `;

  return rows[0]
    ? {
        id: rows[0].id.toString(),
        userId: rows[0].user_id.toString(),
      }
    : null;
}

export async function ensureHorokTechMemberProfile() {
  const currentUser = await getCurrentPlatformAuthUser("tech");

  if (!currentUser) {
    return null;
  }

  await ensureHorokTechSchema();

  const rows = await prisma.$queryRaw<
    Array<{ id: bigint; user_id: bigint; display_name: string | null }>
  >`
    INSERT INTO horok_tech.members (user_id, display_name, avatar_url)
    VALUES (${currentUser.userId}, ${currentUser.name}, ${currentUser.image})
    ON CONFLICT (user_id) DO UPDATE
    SET updated_at = NOW()
    RETURNING id, user_id, display_name
  `;

  return rows[0]
    ? {
        id: rows[0].id.toString(),
        userId: rows[0].user_id.toString(),
        displayName: rows[0].display_name,
      }
    : null;
}

export async function getCurrentPlatformProfile(platform: PlatformProfileKind) {
  const currentUser = await getCurrentPlatformAuthUser(platform);

  if (!currentUser) {
    return null;
  }

  if (platform === "cote") {
    await ensureHorokCoteMemberProfile();

    const member = await prisma.coteMember.findUnique({
      where: { userId: currentUser.userId },
      select: {
        nickname: true,
        avatarUrl: true,
      },
    });

    return {
      platform,
      name: member?.nickname ?? currentUser.name,
      image: member?.avatarUrl ?? currentUser.image,
      email: currentUser.email,
    };
  }

  await ensureHorokTechMemberProfile();

  const member = await prisma.techMember.findUnique({
    where: { userId: currentUser.userId },
    select: {
      displayName: true,
      avatarUrl: true,
    },
  });

  return {
    platform,
    name: member?.displayName ?? currentUser.name,
    image: member?.avatarUrl ?? currentUser.image,
    email: currentUser.email,
  };
}

export async function updateCurrentPlatformProfile(
  platform: PlatformProfileKind,
  data: {
    name?: string;
    image?: string | null;
  },
) {
  const currentUser = await getCurrentPlatformAuthUser(platform);

  if (!currentUser) {
    return null;
  }

  if (platform === "cote") {
    await ensureHorokCoteMemberProfile();

    const member = await prisma.coteMember.update({
      where: { userId: currentUser.userId },
      data: {
        ...(data.name !== undefined ? { nickname: data.name } : {}),
        ...(data.image !== undefined ? { avatarUrl: data.image } : {}),
      },
      select: {
        nickname: true,
        avatarUrl: true,
      },
    });

    return {
      name: member.nickname,
      image: member.avatarUrl,
    };
  }

  await ensureHorokTechMemberProfile();

  const member = await prisma.techMember.update({
    where: { userId: currentUser.userId },
    data: {
      ...(data.name !== undefined ? { displayName: data.name } : {}),
      ...(data.image !== undefined ? { avatarUrl: data.image } : {}),
    },
    select: {
      displayName: true,
      avatarUrl: true,
    },
  });

  return {
    name: member.displayName,
    image: member.avatarUrl,
  };
}

export async function checkPlatformNicknameAvailability(
  platform: PlatformProfileKind,
  name: string,
  excludeUserId?: string,
) {
  const excludeId =
    excludeUserId && /^\d+$/.test(excludeUserId) ? BigInt(excludeUserId) : null;

  if (platform === "cote") {
    const member = await prisma.coteMember.findFirst({
      where: {
        nickname: { equals: name, mode: "insensitive" },
        ...(excludeId ? { NOT: { userId: excludeId } } : {}),
      },
      select: { id: true },
    });

    return member
      ? { available: false, message: "이미 사용 중인 닉네임입니다." }
      : { available: true, message: "사용 가능한 닉네임입니다." };
  }

  const member = await prisma.techMember.findFirst({
    where: {
      displayName: { equals: name, mode: "insensitive" },
      ...(excludeId ? { NOT: { userId: excludeId } } : {}),
    },
    select: { id: true },
  });

  return member
    ? { available: false, message: "이미 사용 중인 닉네임입니다." }
    : { available: true, message: "사용 가능한 닉네임입니다." };
}
