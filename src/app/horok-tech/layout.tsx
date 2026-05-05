import type { ReactNode } from "react";
import { ensureHorokTechMemberProfile } from "@/lib/horok-cote-profile";

export default async function HorokTechLayout({
  children,
}: {
  children: ReactNode;
}) {
  await ensureHorokTechMemberProfile();

  return children;
}
