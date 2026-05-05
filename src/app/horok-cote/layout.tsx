import type { ReactNode } from "react";
import { ensureHorokCoteMemberProfile } from "@/lib/horok-cote-profile";

export default async function HorokCoteLayout({
  children,
}: {
  children: ReactNode;
}) {
  await ensureHorokCoteMemberProfile();

  return children;
}
