export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { EXPENSE_CATEGORIES } from "@/lib/expense-utils";
import AddExpenseForm from "./AddExpenseForm";
import FinanceCharts from "./FinanceCharts";
import DeleteExpenseButton from "./DeleteExpenseButton";
import MonthSelector from "./MonthSelector";

export default async function FinancePage({
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

  const monthLabel = new Date(`${month}-01`).toLocaleDateString("th-TH", { year: "numeric", month: "long" });

  const [entries, expenses, employees, allBrands] = await Promise.all([
    prisma.timeEntry.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      include: { user: true },
    }),
    prisma.expense.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      orderBy: { date: "desc" },
    }),
    prisma.user.findMany({ where: { role: "EMPLOYEE", isActive: true } }),
    prisma.brand.findMany({ where: { isActive: true }, select: { id: true, name: true, commissionRate: true, color: true } }),
  ]);

  const totalRevenue = entries.reduce((s, e) => s + e.salesAmount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const profit = totalRevenue - totalExpenses;

  // Commission calculation per brand
  const brandMap: Record<string, { name: string; commissionRate: number; color: string }> = {};
  for (const b of allBrands) brandMap[b.id] = b;

  const commissionByBrand: Record<string, { name: string; color: string; sales: number; commission: number }> = {};
  let unbrandedSales = 0;
  for (const e of entries) {
    if (e.brandId && brandMap[e.brandId]) {
      const b = brandMap[e.brandId];
      if (!commissionByBrand[e.brandId]) commissionByBrand[e.brandId] = { name: b.name, color: b.color, sales: 0, commission: 0 };
      commissionByBrand[e.brandId].sales += e.salesAmount;
      commissionByBrand[e.brandId].commission += e.salesAmount * b.commissionRate / 100;
    } else {
      unbrandedSales += e.salesAmount;
    }
  }
  const totalCommission = Object.values(commissionByBrand).reduce((s, b) => s + b.commission, 0);
  const brandedSales = totalRevenue - unbrandedSales;
  const commissionCoverage = totalRevenue > 0 ? Math.round((brandedSales / totalRevenue) * 100) : 0;

  // Per employee sales
  const empSales: Record<string, { name: string; sales: number; salary: number; incentiveRate: number }> = {};
  for (const emp of employees) {
    empSales[emp.id] = { name: emp.name, sales: 0, salary: emp.salary, incentiveRate: emp.incentiveRate };
  }
  for (const e of entries) {
    if (empSales[e.userId]) empSales[e.userId].sales += e.salesAmount;
  }

  // By expense category
  const byCat: Record<string, number> = {};
  for (const e of expenses) {
    byCat[e.category] = (byCat[e.category] || 0) + e.amount;
  }

  const catData = Object.entries(byCat).map(([cat, total]) => ({
    label: EXPENSE_CATEGORIES[cat]?.label || cat,
    emoji: EXPENSE_CATEGORIES[cat]?.emoji || "📋",
    total,
  })).sort((a, b) => b.total - a.total);

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">💰 รายงานการเงิน</h1>
        <MonthSelector value={month} />
      </div>

      <p className="text-sm text-gray-500 -mt-2">{monthLabel}</p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white rounded-2xl p-3 shadow-sm border-l-4 border-green-400">
          <div className="text-xs text-gray-500 mb-1">ยอดขายรวม</div>
          <div className="font-bold text-green-600 text-base">{formatCurrency(totalRevenue)}</div>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm border-l-4 border-red-400">
          <div className="text-xs text-gray-500 mb-1">รายจ่ายรวม</div>
          <div className="font-bold text-red-500 text-base">{formatCurrency(totalExpenses)}</div>
        </div>
        <div className={`rounded-2xl p-3 shadow-sm border-l-4 ${profit >= 0 ? "border-[#F5D400] bg-[#FFF8CC]" : "border-red-400 bg-red-50"}`}>
          <div className="text-xs text-gray-500 mb-1">กำไร/ขาดทุน</div>
          <div className={`font-bold text-base ${profit >= 0 ? "text-[#1A1A1A]" : "text-red-600"}`}>
            {profit >= 0 ? "+" : ""}{formatCurrency(profit)}
          </div>
        </div>
        {totalCommission > 0 && (
          <div className="bg-white rounded-2xl p-3 shadow-sm border-l-4 border-emerald-400">
            <div className="text-xs text-gray-500 mb-1">รายได้จริง (Commission)</div>
            <div className="font-bold text-emerald-600 text-base">{formatCurrency(totalCommission)}</div>
            {unbrandedSales > 0 && (
              <div className="mt-1 text-xs text-amber-600">⚠️ ไม่ระบุแบรนด์ {formatCurrency(unbrandedSales)}</div>
            )}
          </div>
        )}
      </div>

      {/* Commission by brand */}
      {(Object.keys(commissionByBrand).length > 0 || unbrandedSales > 0) && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[#1A1A1A]">🏷️ รายได้จริงตามแบรนด์</h2>
            {unbrandedSales > 0 && Object.keys(commissionByBrand).length > 0 && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                ติดตาม {commissionCoverage}%
              </span>
            )}
          </div>
          <div className="space-y-2">
            {Object.values(commissionByBrand).sort((a, b) => b.commission - a.commission).map((b, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: b.color }} />
                  <span className="text-gray-700 font-medium">{b.name}</span>
                  <span className="text-xs text-gray-400">{formatCurrency(b.sales)}</span>
                </div>
                <span className="font-bold text-green-600">{formatCurrency(b.commission)}</span>
              </div>
            ))}
            {unbrandedSales > 0 && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 opacity-60">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                  <span className="text-gray-500 font-medium">ไม่ระบุแบรนด์</span>
                  <span className="text-xs text-gray-400">{formatCurrency(unbrandedSales)}</span>
                </div>
                <span className="text-xs text-gray-400 italic">ไม่ทราบ commission</span>
              </div>
            )}
          </div>
          {unbrandedSales > 0 && Object.keys(commissionByBrand).length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full transition-all" style={{ width: `${commissionCoverage}%` }} />
                <div className="bg-gray-200 h-full flex-1" />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>ระบุแบรนด์ {formatCurrency(brandedSales)}</span>
                <span>ไม่ระบุ {formatCurrency(unbrandedSales)}</span>
              </div>
            </div>
          )}
          {unbrandedSales > 0 && Object.keys(commissionByBrand).length === 0 && (
            <p className="text-sm text-gray-400 text-center py-2">ยอดขายทั้งหมดยังไม่ได้ระบุแบรนด์ — ยังไม่สามารถคำนวณ commission ได้</p>
          )}
        </div>
      )}

      {/* Charts */}
      <FinanceCharts totalRevenue={totalRevenue} totalExpenses={totalExpenses} catData={catData} />

      {/* Employee Sales Leaderboard */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="font-bold text-[#1A1A1A] mb-3">🏆 Leaderboard พนักงาน</h2>
        {Object.values(empSales).length === 0 ? (
          <p className="text-gray-400 text-center py-4">ยังไม่มีข้อมูล</p>
        ) : (
          <div className="space-y-3">
            {Object.values(empSales).sort((a, b) => b.sales - a.sales).map((emp, i) => {
              const incentive = (emp.sales * emp.incentiveRate) / 100;
              const maxSales = Math.max(...Object.values(empSales).map(e => e.sales), 1);
              const pct = (emp.sales / maxSales) * 100;
              const MEDALS = ["🥇", "🥈", "🥉"];
              return (
                <div key={emp.name}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{MEDALS[i] || "👤"}</span>
                      <div>
                        <div className="font-semibold text-[#1A1A1A] text-sm">{emp.name}</div>
                        <div className="text-xs text-gray-400">
                          เงินเดือน {formatCurrency(emp.salary)} · Incentive {formatCurrency(incentive)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#1A1A1A]">{formatCurrency(emp.sales)}</div>
                      <div className="text-xs text-[#F5A882]">รวมจ่าย {formatCurrency(emp.salary + incentive)}</div>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: "linear-gradient(90deg, #F5D400, #F5A882)" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Expense */}
      <AddExpenseForm />

      {/* Expense by category */}
      {catData.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-bold text-[#1A1A1A] mb-3">📊 รายจ่ายตามหมวดหมู่</h2>
          <div className="space-y-2">
            {catData.map((c) => (
              <div key={c.label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <span className="text-gray-700">{c.emoji} {c.label}</span>
                <span className="font-bold text-red-500">{formatCurrency(c.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expense list */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="font-bold text-[#1A1A1A] mb-3">📋 รายการรายจ่าย</h2>
        {expenses.length === 0 ? (
          <p className="text-gray-400 text-center py-4">ยังไม่มีรายจ่ายเดือนนี้</p>
        ) : (
          <div className="space-y-2">
            {expenses.map((exp) => (
              <div key={exp.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <div>
                  <div className="font-medium text-[#1A1A1A] text-sm">
                    {EXPENSE_CATEGORIES[exp.category]?.emoji} {exp.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {EXPENSE_CATEGORIES[exp.category]?.label} · {exp.date}
                    {exp.isRecurring && " · 🔄 ประจำ"}
                  </div>
                  {exp.notes && <div className="text-xs text-gray-400">📝 {exp.notes}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-red-500">{formatCurrency(exp.amount)}</span>
                  <DeleteExpenseButton id={exp.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export buttons */}
      <div className="grid grid-cols-2 gap-3 pb-4">
        <a href={`/api/export/excel?month=${month}`}
          className="flex items-center justify-center gap-2 h-12 bg-green-500 text-white rounded-2xl font-semibold text-sm hover:bg-green-600 transition-colors">
          📊 Export Excel
        </a>
        <a href={`/api/export/pdf?month=${month}`} target="_blank"
          className="flex items-center justify-center gap-2 h-12 bg-red-500 text-white rounded-2xl font-semibold text-sm hover:bg-red-600 transition-colors">
          📄 Export PDF
        </a>
      </div>
    </div>
  );
}
