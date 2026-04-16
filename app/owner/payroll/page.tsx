export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import MonthSelector from "../finance/MonthSelector";
import PayrollActions from "./PayrollActions";

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: rawMonth } = await searchParams;
  const now = new Date();
  const month = rawMonth || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [year, mon] = month.split("-");
  const startDate = `${year}-${mon}-01`;
  const lastDay = new Date(parseInt(year), parseInt(mon), 0).getDate();
  const endDate = `${year}-${mon}-${String(lastDay).padStart(2, "0")}`;

  const monthLabel = new Date(`${month}-01`).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
  });

  const [employees, entries] = await Promise.all([
    prisma.user.findMany({
      where: { role: "EMPLOYEE", isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.timeEntry.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      select: { userId: true, salesAmount: true },
    }),
  ]);

  // คำนวณยอดขายแต่ละคน
  const salesMap: Record<string, number> = {};
  for (const e of entries) {
    salesMap[e.userId] = (salesMap[e.userId] || 0) + e.salesAmount;
  }

  const payrollRows = employees.map((emp) => {
    const sales = salesMap[emp.id] || 0;
    const incentive = (sales * emp.incentiveRate) / 100;
    const total = emp.salary + incentive;
    return {
      id: emp.id,
      name: emp.name,
      salary: emp.salary,
      incentiveRate: emp.incentiveRate,
      sales,
      incentive,
      total,
    };
  });

  const grandSalary = payrollRows.reduce((s, r) => s + r.salary, 0);
  const grandIncentive = payrollRows.reduce((s, r) => s + r.incentive, 0);
  const grandTotal = payrollRows.reduce((s, r) => s + r.total, 0);

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">💵 สรุปจ่ายเงินเดือน</h1>
        <MonthSelector value={month} />
      </div>
      <p className="text-sm text-gray-500 -mt-2">{monthLabel}</p>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-2xl p-3 shadow-sm border-l-4 border-blue-400">
          <div className="text-xs text-gray-500 mb-1">เงินเดือนรวม</div>
          <div className="font-bold text-blue-600 text-sm">{formatCurrency(grandSalary)}</div>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm border-l-4 border-orange-400">
          <div className="text-xs text-gray-500 mb-1">Incentive รวม</div>
          <div className="font-bold text-orange-500 text-sm">{formatCurrency(grandIncentive)}</div>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm border-l-4 border-[#F5D400]">
          <div className="text-xs text-gray-500 mb-1">จ่ายทั้งหมด</div>
          <div className="font-bold text-[#1A1A1A] text-sm">{formatCurrency(grandTotal)}</div>
        </div>
      </div>

      {/* Payroll table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-[#1A1A1A]">📋 รายละเอียดแต่ละคน</h2>
          <span className="text-xs text-gray-400">{payrollRows.length} คน</span>
        </div>

        {payrollRows.length === 0 ? (
          <p className="text-gray-400 text-center py-8">ยังไม่มีพนักงาน</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {payrollRows.map((row, i) => (
              <div key={row.id} className="px-4 py-4">
                {/* Name + medal */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{["🥇", "🥈", "🥉"][i] || "👤"}</span>
                    <span className="font-semibold text-[#1A1A1A]">{row.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">ยอดขาย</div>
                    <div className="font-semibold text-gray-700 text-sm">{formatCurrency(row.sales)}</div>
                  </div>
                </div>

                {/* Pay breakdown */}
                <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">💼 เงินเดือน</span>
                    <span className="font-medium text-gray-700">{formatCurrency(row.salary)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      🎯 Incentive
                      <span className="text-xs text-gray-400 ml-1">({row.incentiveRate}% × {formatCurrency(row.sales)})</span>
                    </span>
                    <span className="font-medium text-orange-500">{formatCurrency(row.incentive)}</span>
                  </div>
                  <div className="h-px bg-gray-200 my-1" />
                  <div className="flex justify-between">
                    <span className="font-bold text-[#1A1A1A]">รวมจ่าย</span>
                    <span className="font-bold text-lg text-[#1A1A1A]">{formatCurrency(row.total)}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Grand total row */}
            <div className="px-4 py-4 bg-[#FFF8CC]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#1A1A1A]">💰 รวมจ่ายทั้งทีม</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    เงินเดือน {formatCurrency(grandSalary)} + Incentive {formatCurrency(grandIncentive)}
                  </div>
                </div>
                <div className="text-2xl font-bold text-[#1A1A1A]">{formatCurrency(grandTotal)}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export */}
      <PayrollActions
        month={month}
        monthLabel={monthLabel}
        rows={payrollRows}
        grandSalary={grandSalary}
        grandIncentive={grandIncentive}
        grandTotal={grandTotal}
      />
    </div>
  );
}
