"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  const mon = new Date(d);
  mon.setDate(d.getDate() - ((day + 6) % 7));
  return mon.toISOString().slice(0, 10);
}

type Props = {
  weekStart: string;
  userId: string;
};

export default function WeekPicker({ weekStart, userId }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (!val) return;
    const monday = getWeekStart(val);
    const p = new URLSearchParams({ week: monday, userId });
    router.push(`/owner/schedule?${p.toString()}`);
  }

  return (
    <label className="relative w-8 h-8 flex-shrink-0 cursor-pointer">
      <span className="w-8 h-8 flex items-center justify-center rounded-xl border-2 border-gray-200 text-base hover:border-[#F5D400] select-none">
        📅
      </span>
      <input
        ref={inputRef}
        type="date"
        defaultValue={weekStart}
        onChange={handleChange}
        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
      />
    </label>
  );
}
