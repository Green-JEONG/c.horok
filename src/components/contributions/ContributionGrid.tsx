"use client";

import { useEffect, useMemo, useState } from "react";

type Contribution = {
  date: string;
  count: number;
};

function getColor(count: number) {
  if (count === 0) return "bg-muted";
  if (count < 2) return "bg-emerald-200";
  if (count < 4) return "bg-emerald-400";
  return "bg-emerald-600";
}

const WEEKS = 36;
const DAYS = WEEKS * 7;

export default function ContributionGrid({ userId }: { userId?: number }) {
  const [data, setData] = useState<Contribution[]>([]);

  const map = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of data) {
      m.set(d.date, d.count);
    }
    return m;
  }, [data]);

  const days = useMemo(() => {
    const result: string[] = [];
    const today = new Date();

    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      result.push(d.toISOString().slice(0, 10));
    }
    return result;
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();

    if (userId) {
      params.set("userId", String(userId));
    }

    const query = params.toString();

    fetch(`/api/users/contributions${query ? `?${query}` : ""}`)
      .then(async (res) => {
        if (!res.ok) {
          console.error("API failed:", res.status);
          return [];
        }
        return res.json();
      })
      .then((d) => {
        console.log("CONTRIBUTIONS:", d);
        setData(Array.isArray(d) ? d : []);
      })
      .catch((err) => {
        console.error("fetch error:", err);
        setData([]);
      });
  }, [userId]);

  return (
    <div className="rounded-xl border bg-background p-3">
      <p className="text-sm font-semibold"></p>

      <div
        className="grid w-full gap-1"
        style={{
          gridAutoFlow: "column",
          gridTemplateRows: "repeat(7, minmax(0, 1fr))",
          gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))`,
        }}
      >
        {days.map((date) => {
          const count = map.get(date) ?? 0;
          return (
            <div
              key={date}
              title={`${date}: ${count}회`}
              className={`aspect-square w-full rounded-[3px] ${getColor(count)}`}
            />
          );
        })}
      </div>
    </div>
  );
}
