"use client";

import { useEffect, useState } from "react";

type Stats = {
  month: string;
  myMonthSales: number;
  myTodaySales: number;
  myIncentive: number;
  mySalary: number;
  targetAmount: number;
  entryCount: number;
  showSalary: boolean;
};

function fmt(n: number) {
  return new Intl.NumberFormat("th-TH").format(Math.round(n));
}

export default function MyStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/my-stats")
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  if (!stats) return null;

  const pct = stats.targetAmount > 0
    ? Math.min(100, (stats.myMonthSales / stats.targetAmount) * 100)
    : null;

  return (
    <div className="mx-4 mt-3">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        {/* Header row */}
        <div className="px-4 pt-3 pb-2">
          <span className="text-sm font-bold text-[#1A1A1A]">
            📊 ยอดขายของฉัน ({stats.month.replace("-", "/")})
          </span>
        </div>

        {/* Two main stats */}
        <div className="grid grid-cols-2 gap-px bg-gray-100">
          <div className="bg-white px-4 py-3">
            <div className="text-xs text-gray-500 mb-0.5">วันนี้</div>
            <div className="text-xl font-bold text-[#1A1A1A]">
              ฿{fmt(stats.myTodaySales)}
            </div>
          </div>
          <div className="bg-white px-4 py-3">
            <div className="text-xs text-gray-500 mb-0.5">เดือนนี้ ({stats.entryCount} รายการ)</div>
            <div className="text-xl font-bold text-[#1A1A1A]">
              ฿{fmt(stats.myMonthSales)}
            </div>
          </div>
        </div>

        {/* Target progress */}
        {pct !== null && (
          <div className="px-4 py-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>เป้าหมาย ฿{fmt(stats.targetAmount)}</span>
              <span className="font-semibold text-[#1A1A1A]">{pct.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  background: pct >= 100
                    ? "linear-gradient(90deg, #22c55e, #16a34a)"
                    : "linear-gradient(90deg, #F5D400, #F5A882)",
                }}
              />
            </div>
          </div>
        )}

        {/* Incentive row */}
        {stats.showSalary && (stats.myIncentive > 0 || stats.mySalary > 0) && (
          <div className="px-4 pb-3 pt-1 flex gap-3 text-xs text-gray-500">
            {stats.mySalary > 0 && (
              <span>💼 เงินเดือน <span className="font-semibold text-[#1A1A1A]">฿{fmt(stats.mySalary)}</span></span>
            )}
            {stats.myIncentive > 0 && (
              <span>🎯 Incentive <span className="font-semibold text-[#F5A882]">~฿{fmt(stats.myIncentive)}</span></span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
