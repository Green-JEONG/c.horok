import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { findUserByEmail, upsertOAuthUser } from "@/lib/db";
import { env } from "@/lib/env";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    }),

    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),

    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim()
            : null;

        const password =
          typeof credentials?.password === "string"
            ? credentials.password
            : null;

        if (!email || !password) return null;

        const user = await findUserByEmail(email);
        if (!user) return null;
        if (!user.password) return null;

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        return {
          id: String(user.id),
          email: user.email,
          name: user.name ?? undefined,
          role: user.role,
          provider: user.provider,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "github" || account?.provider === "google") {
        const email = user.email;
        const providerId =
          account.provider === "github"
            ? String(profile?.id)
            : String(profile?.sub);

        if (!email || !providerId) return false;

        const dbUser = await upsertOAuthUser({
          email,
          name: user.name ?? null,
          image: user.image ?? null,
          provider: account.provider,
          providerId,
        });

        if (!dbUser) return false;

        user.dbUserId = String(dbUser.id);
        user.image = dbUser.image ?? user.image;
        user.oauthImage = dbUser.oauth_image;
        user.role = dbUser.role;
        user.provider = dbUser.provider;
      }

      return true;
    },

    async jwt({ token, user, trigger, session }) {
      // 최초 로그인
      if (user) {
        if (typeof user.dbUserId === "string") {
          token.userId = user.dbUserId;
        } else if (typeof user.id === "string") {
          token.userId = user.id;
        }
        if (user.role === "USER" || user.role === "ADMIN") {
          token.role = user.role;
        }
        if (
          user.provider === "credentials" ||
          user.provider === "github" ||
          user.provider === "google"
        ) {
          token.provider = user.provider;
        }
        if (typeof user.name === "string") {
          token.name = user.name;
        }
        if (typeof user.image === "string") {
          token.picture = user.image;
        }
        if (typeof user.oauthImage === "string" || user.oauthImage === null) {
          token.oauthImage = user.oauthImage;
        }
      }

      // useSession().update() 호출 시
      if (trigger === "update") {
        if (typeof session?.name === "string") {
          token.name = session.name;
        }
        if ("image" in (session ?? {})) {
          token.picture =
            typeof session?.image === "string" ? session.image : null;
        }
      }

      if (!token.userId && typeof token.email === "string") {
        const dbUser = await findUserByEmail(token.email);
        if (dbUser) {
          token.userId = dbUser.id;
          token.role = dbUser.role;
          token.provider = dbUser.provider;
          token.name = dbUser.name ?? token.name;
          token.picture = dbUser.image ?? token.picture;
          token.oauthImage = dbUser.oauth_image;
        }
      }

      return token;
    },

    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.userId ?? token.sub) as string;
        session.user.role = token.role as "USER" | "ADMIN";
        session.user.provider = token.provider as
          | "credentials"
          | "github"
          | "google"
          | undefined;
        session.user.image =
          typeof token.picture === "string" ? token.picture : null;
        session.user.oauthImage =
          typeof token.oauthImage === "string" || token.oauthImage === null
            ? token.oauthImage
            : null;
      }
      return session;
    },
  },
});

export const { GET, POST } = handlers;
