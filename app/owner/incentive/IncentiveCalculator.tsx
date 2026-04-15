"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

type Employee = {
  id: string;
  name: string;
  incentiveRate: number;
  totalSales: number;
  entryCount: number;
};

type Props = { employees: Employee[] };

export default function IncentiveCalculator({ employees }: Props) {
  const [bonuses, setBonuses] = useState<Record<string, string>>({});
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  function calcIncentive(emp: Employee) {
    const base = (emp.totalSales * emp.incentiveRate) / 100;
    const bonus = parseFloat(bonuses[emp.id] || "0") || 0;
    return base + bonus;
  }

  const grandTotal = employees.reduce((s, e) => s + calcIncentive(e), 0);
  const totalSales = employees.reduce((s, e) => s + e.totalSales, 0);

  const monthLabel = new Date(month + "-01").toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-bold text-lg">💰 คำนวณ Incentive</h2>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-white/20 text-white rounded-xl px-3 py-1 text-sm border border-white/30"
          />
        </div>
        <div className="text-indigo-200 text-sm">{monthLabel}</div>
        <div className="mt-2 text-sm text-indigo-100">
          ยอดขายรวม: <span className="font-bold text-white">{formatCurrency(totalSales)}</span>
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="p-6 text-center text-gray-400">ยังไม่มีพนักงาน</div>
      ) : (
        <div className="divide-y divide-gray-50">
          {employees.map((emp) => {
            const base = (emp.totalSales * emp.incentiveRate) / 100;
            const bonus = parseFloat(bonuses[emp.id] || "0") || 0;
            const total = base + bonus;

            return (
              <div key={emp.id} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold text-gray-800">{emp.name}</div>
                    <div className="text-xs text-gray-400">
                      {emp.entryCount} รายการ · ยอดขาย {formatCurrency(emp.totalSales)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">{emp.incentiveRate}%</div>
                    <div className="font-bold text-indigo-600">{formatCurrency(base)}</div>
                  </div>
                </div>

                {/* Bonus input */}
                <div className="flex items-center gap-2 mt-2">
                  <label className="text-sm text-gray-500 shrink-0">โบนัสเพิ่ม:</label>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">฿</span>
                    <input
                      type="number"
                      min="0"
                      value={bonuses[emp.id] || ""}
                      onChange={(e) =>
                        setBonuses((prev) => ({ ...prev, [emp.id]: e.target.value }))
                      }
                      placeholder="0"
                      className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-gray-400">รวม</div>
                    <div className="font-bold text-green-600">{formatCurrency(total)}</div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Grand total */}
          <div className="p-4 bg-gray-50 flex justify-between items-center">
            <div className="font-bold text-gray-800">💰 รวมทั้งหมด</div>
            <div className="text-xl font-bold text-green-600">{formatCurrency(grandTotal)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
