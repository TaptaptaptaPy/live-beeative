"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

function addMonths(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const MONTH_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export default function MonthSelector({ value }: { value: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const [selYear, setSelYear] = useState(() => parseInt(value.split("-")[0]));
  const currentMonth = parseInt(value.split("-")[1]);

  const now = new Date();
  const nowYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const isCurrentMonth = value === nowYM;

  // ปิด dropdown เมื่อคลิกนอก
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function goTo(year: number, month: number) {
    const ym = `${year}-${String(month).padStart(2, "0")}`;
    router.push(`?month=${ym}`);
    setOpen(false);
  }

  const displayLabel = new Date(`${value}-01`).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
  });

  return (
    <div className="relative" ref={ref}>
      {/* Main bar: ‹ label › */}
      <div className="flex items-center gap-1 bg-white border-2 border-[#F5D400] rounded-2xl px-1 py-1">
        <button
          onClick={() => router.push(`?month=${addMonths(value, -1)}`)}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-600 hover:bg-[#FFF8CC] active:scale-95 transition-all text-lg font-bold"
        >‹</button>

        {/* คลิกที่ชื่อเดือนเพื่อเปิด dropdown */}
        <button
          onClick={() => { setSelYear(parseInt(value.split("-")[0])); setOpen(!open); }}
          className="text-sm font-semibold text-[#1A1A1A] min-w-[88px] text-center px-1 py-1 rounded-xl hover:bg-[#FFF8CC] transition-all"
        >
          {displayLabel} ▾
        </button>

        <button
          onClick={() => router.push(`?month=${addMonths(value, 1)}`)}
          disabled={isCurrentMonth}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-600 hover:bg-[#FFF8CC] active:scale-95 transition-all text-lg font-bold disabled:opacity-30"
        >›</button>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 bg-white border-2 border-[#F5D400] rounded-2xl shadow-xl z-50 p-3 w-64">
          {/* Year selector */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setSelYear(y => y - 1)}
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#FFF8CC] text-gray-600 font-bold"
            >‹</button>
            <span className="font-bold text-[#1A1A1A]">
              {selYear + 543} {/* แสดงเป็น พ.ศ. */}
            </span>
            <button
              onClick={() => setSelYear(y => y + 1)}
              disabled={selYear >= now.getFullYear()}
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#FFF8CC] text-gray-600 font-bold disabled:opacity-30"
            >›</button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-4 gap-1.5">
            {MONTH_SHORT.map((label, i) => {
              const m = i + 1;
              const ym = `${selYear}-${String(m).padStart(2, "0")}`;
              const isSelected = ym === value;
              const isFuture = ym > nowYM;
              return (
                <button
                  key={m}
                  onClick={() => goTo(selYear, m)}
                  disabled={isFuture}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? "text-[#1A1A1A] shadow-sm"
                      : isFuture
                      ? "text-gray-200 cursor-not-allowed"
                      : "text-gray-600 hover:bg-[#FFF8CC]"
                  }`}
                  style={isSelected ? { background: "linear-gradient(135deg,#F5D400,#F5A882)" } : {}}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
