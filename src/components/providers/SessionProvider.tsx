"use client";

import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function AuthSessionProvider({ children }: Props) {
  const pathname = usePathname();
  const basePath = pathname?.startsWith("/horok-cote")
    ? "/api/cote-auth"
    : "/api/auth";

  return <SessionProvider basePath={basePath}>{children}</SessionProvider>;
}
