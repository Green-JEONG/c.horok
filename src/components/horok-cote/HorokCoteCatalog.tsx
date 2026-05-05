"use client";

import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import HorokCoteLevelDropdown from "@/components/horok-cote/HorokCoteLevelDropdown";
import HeaderActions from "@/components/layout/HeaderActions";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { HOROK_COTE_LEVELS, type HorokCoteProblem } from "@/lib/horok-cote";
import HorokCoteProblemBrowser from "./HorokCoteProblemBrowser";

type HorokCoteCatalogProps = {
  problems: HorokCoteProblem[];
  initialSelectedLevel: string;
};

export default function HorokCoteCatalog({
  problems,
  initialSelectedLevel,
}: HorokCoteCatalogProps) {
  const [selectedLevel, setSelectedLevel] = useState(initialSelectedLevel);

  return (
    <>
      <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Link
              href="/horok-cote"
              className="flex items-center gap-1.5 font-bold text-slate-950 transition hover:opacity-80 dark:text-slate-50"
            >
              <Image src="/logo.svg" alt="horok-cote" width={36} height={24} />
              <span className="flex flex-col items-center text-sm leading-none">
                <span>horok</span>
                <span>cote</span>
              </span>
            </Link>
            <ChevronRight className="size-4 text-slate-300 dark:text-slate-600" />
            <HorokCoteLevelDropdown
              levels={HOROK_COTE_LEVELS}
              value={selectedLevel}
              onChange={setSelectedLevel}
            />
          </div>
          <div className="flex items-center gap-2">
            <HeaderActions />
            <div className="rounded-full border border-slate-200 bg-slate-50 p-1 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
      <HorokCoteProblemBrowser
        problems={problems}
        selectedLevel={selectedLevel}
        onSelectedLevelChange={setSelectedLevel}
        showLevelTabs={false}
      />
    </>
  );
}
