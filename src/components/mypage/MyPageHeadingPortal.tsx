"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MYPAGE_HEADING_SLOT_ID } from "@/components/mypage/MyPageHeading";

type Props = {
  children: ReactNode;
  disabled?: boolean;
};

export default function MyPageHeadingPortal({ children, disabled }: Props) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (disabled) {
      setSlot(null);
      return;
    }

    setSlot(document.getElementById(MYPAGE_HEADING_SLOT_ID));
  }, [disabled]);

  if (!slot) {
    return null;
  }

  return createPortal(children, slot);
}
