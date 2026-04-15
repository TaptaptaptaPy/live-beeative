export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import TargetsForm from "./TargetsForm";

export default async function TargetsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = today.slice(0, 7);

  const [employees, salesTargets, expenseBudget, monthlySales, monthlyExpenses] = await Promise.all([
    prisma.user.findMany({ where: { role: "EMPLOYEE", isActive: true }, orderBy: { name: "asc" } }),
    prisma.salesTarget.findMany({
      where: { month: currentMonth },
      include: { user: true },
    }),
    prisma.expenseBudget.findUnique({ where: { month: currentMonth } }),
    prisma.timeEntry.aggregate({
      where: { date: { gte: currentMonth + "-01", lte: today } },
      _sum: { salesAmount: true },
    }),
    prisma.expense.aggregate({
      where: { date: { gte: currentMonth + "-01", lte: today } },
      _sum: { amount: true },
    }),
  ]);

  // Per-employee actual sales this month
  const empSales = await prisma.timeEntry.groupBy({
    by: ["userId"],
    where: { date: { gte: currentMonth + "-01", lte: today } },
    _sum: { salesAmount: true },
  });
  const empSalesMap: Record<string, number> = {};
  for (const e of empSales) empSalesMap[e.userId] = e._sum.salesAmount ?? 0;

  const totalActual = monthlySales._sum.salesAmount ?? 0;
  const totalExpenseActual = monthlyExpenses._sum.amount ?? 0;

  const overallTarget = salesTargets.find(t => !t.userId);
  const empTargetMap: Record<string, number> = {};
  for (const t of salesTargets) {
    if (t.userId) empTargetMap[t.userId] = t.amount;
  }

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[#1A1A1A] pt-2">🎯 ตั้งเป้ายอดขาย</h1>
      <p className="text-sm text-gray-500">เดือน: {currentMonth}</p>

      {/* Overall progress */}
      <div className="space-y-3">
        {overallTarget && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-[#1A1A1A]">🏆 เป้าทีมรวม</span>
              <span className="text-sm text-gray-500">
                ฿{totalActual.toLocaleString("th-TH", { maximumFractionDigits: 0 })} / ฿{overallTarget.amount.toLocaleString("th-TH", { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min((totalActual / overallTarget.amount) * 100, 100)}%`,
                  background: totalActual >= overallTarget.amount ? "#22c55e" : "linear-gradient(90deg, #F5D400, #F5A882)"
                }} />
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {((totalActual / overallTarget.amount) * 100).toFixed(1)}% ของเป้า
              {totalActual >= overallTarget.amount ? " 🎉 ถึงเป้าแล้ว!" : ""}
            </div>
          </div>
        )}

        {expenseBudget && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-[#1A1A1A]">💸 งบรายจ่าย</span>
              <span className="text-sm text-gray-500">
                ฿{totalExpenseActual.toLocaleString("th-TH", { maximumFractionDigits: 0 })} / ฿{expenseBudget.amount.toLocaleString("th-TH", { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min((totalExpenseActual / expenseBudget.amount) * 100, 100)}%`,
                  background: totalExpenseActual >= expenseBudget.amount ? "#ef4444" : "#6366f1"
                }} />
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {((totalExpenseActual / expenseBudget.amount) * 100).toFixed(1)}% ของงบ
              {totalExpenseActual >= expenseBudget.amount ? " ⚠️ เกินงบแล้ว!" : ""}
            </div>
          </div>
        )}

        {employees.filter(e => empTargetMap[e.id]).map(emp => {
          const actual = empSalesMap[emp.id] ?? 0;
          const target = empTargetMap[emp.id];
          const pct = Math.min((actual / target) * 100, 100);
          return (
            <div key={emp.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#F5D400] flex-shrink-0">
                  {(emp as { profileImage?: string }).profileImage ? (
                    <img src={(emp as { profileImage?: string }).profileImage!} alt={emp.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#FFF8CC] flex items-center justify-center text-sm font-bold">{emp.name.slice(0,1)}</div>
                  )}
                </div>
                <span className="font-semibold text-[#1A1A1A] flex-1">{emp.name}</span>
                <span className="text-sm text-gray-500">
                  ฿{actual.toLocaleString("th-TH", { maximumFractionDigits: 0 })} / ฿{target.toLocaleString("th-TH", { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: pct >= 100 ? "#22c55e" : "linear-gradient(90deg, #F5D400, #F5A882)" }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Form to set targets */}
      <TargetsForm
        month={currentMonth}
        employees={employees.map(e => ({ id: e.id, name: e.name }))}
        overallTarget={overallTarget?.amount ?? null}
        empTargets={empTargetMap}
        expenseBudget={expenseBudget?.amount ?? null}
      />
    </div>
  );
}
