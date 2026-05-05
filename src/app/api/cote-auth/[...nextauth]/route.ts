import NextAuth from "next-auth";
import { createAuthConfig } from "@/lib/auth-config";

export const {
  handlers,
  auth: coteAuth,
  signIn: coteSignIn,
  signOut: coteSignOut,
} = NextAuth(createAuthConfig("cote"));

export const { GET, POST } = handlers;
