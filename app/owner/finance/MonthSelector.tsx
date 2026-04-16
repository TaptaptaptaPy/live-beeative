"use client";

import { useRouter } from "next/navigation";

function addMonths(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(ym: string): string {
  return new Date(`${ym}-01`).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
  });
}

export default function MonthSelector({ value }: { value: string }) {
  const router = useRouter();
  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const isCurrentMonth = value === currentYM;

  return (
    <div className="flex items-center gap-1 bg-white border-2 border-[#F5D400] rounded-2xl px-1 py-1">
      <button
        onClick={() => router.push(`?month=${addMonths(value, -1)}`)}
        className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-600 hover:bg-[#FFF8CC] active:scale-95 transition-all text-lg font-bold"
        aria-label="เดือนก่อน"
      >
        ‹
      </button>

      <span className="text-sm font-semibold text-[#1A1A1A] min-w-[100px] text-center leading-tight px-1">
        {monthLabel(value)}
      </span>

      <button
        onClick={() => router.push(`?month=${addMonths(value, 1)}`)}
        disabled={isCurrentMonth}
        className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-600 hover:bg-[#FFF8CC] active:scale-95 transition-all text-lg font-bold disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="เดือนถัดไป"
      >
        ›
      </button>
    </div>
  );
}
