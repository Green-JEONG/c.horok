"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type HorokCoteLevelDropdownProps = {
  levels: readonly string[];
  value: string;
  onChange: (level: string) => void;
};

export default function HorokCoteLevelDropdown({
  levels,
  value,
  onChange,
}: HorokCoteLevelDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex min-w-[80px] items-center gap-1.5 rounded-[999px] border border-slate-200 bg-white py-2 pl-4 pr-2 text-sm font-semibold text-slate-950 outline-none transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:hover:border-slate-600"
        >
          <span>{value}</span>
          <ChevronDown className="size-4 text-slate-400 dark:text-slate-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] rounded-[24px] border-slate-200 bg-white p-2 shadow-[0_12px_28px_rgba(15,23,42,0.12)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_20px_36px_rgba(2,6,23,0.5)]"
      >
        {levels.map((level) => (
          <DropdownMenuItem
            key={level}
            className="rounded-[999px] px-3 py-2 text-sm font-semibold text-slate-700 focus:bg-slate-100 focus:text-slate-950 dark:text-slate-200 dark:focus:bg-slate-800 dark:focus:text-slate-50"
            onSelect={() => {
              onChange(level);
              setOpen(false);
            }}
          >
            {level}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
