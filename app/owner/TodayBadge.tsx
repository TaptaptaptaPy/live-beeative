"use client";

import { useEffect, useState } from "react";

// Shows count of entries submitted today — auto-refreshes every 30s
export default function TodayBadge() {
  const [count, setCount] = useState<number | null>(null);

  function fetch_count() {
    const today = new Date().toISOString().slice(0, 10);
    fetch(`/api/entries-count?date=${today}`)
      .then(r => r.json())
      .then(d => setCount(d.count ?? null))
      .catch(() => {});
  }

  useEffect(() => {
    fetch_count();
    const id = setInterval(fetch_count, 30_000);
    return () => clearInterval(id);
  }, []);

  if (!count) return null;

  return (
    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
      {count > 9 ? "9+" : count}
    </span>
  );
}
