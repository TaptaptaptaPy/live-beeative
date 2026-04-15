export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import TargetsForm from "./TargetsForm";
import Link from "next/link";

type Period = "DAILY" | "WEEKLY" | "MONTHLY";

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getCurrentDateKey(period: Period): string {
  const now = new Date();
  if (period === "DAILY") return now.toISOString().slice(0, 10);
  if (period === "WEEKLY") {
    const week = getISOWeek(now);
    return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
  }
  return now.toISOString().slice(0, 7);
}

function getDateRange(period: Period, dateKey: string): { start: string; end: string } {
  if (period === "DAILY") return { start: dateKey, end: dateKey };
  if (period === "MONTHLY") {
    const [y, m] = dateKey.split("-");
    const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate();
    return { start: `${dateKey}-01`, end: `${dateKey}-${String(lastDay).padStart(2, "0")}` };
  }
  // WEEKLY: parse YYYY-Www
  const [yearStr, wStr] = dateKey.split("-W");
  const year = parseInt(yearStr);
  const week = parseInt(wStr);
  // Get monday of that ISO week
  const jan4 = new Date(year, 0, 4);
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  const monday = new Date(startOfWeek1);
  monday.setDate(startOfWeek1.getDate() + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
}

function getLabel(period: Period, dateKey: string): string {
  if (period === "DAILY") {
    const d = new Date(dateKey + "T00:00:00");
    return d.toLocaleDateString("th-TH", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  }
  if (period === "WEEKLY") {
    const { start, end } = getDateRange(period, dateKey);
    const s = new Date(start + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "short" });
    const e = new Date(end + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
    return `สัปดาห์ ${dateKey.split("-W")[1]} (${s} – ${e})`;
  }
  return new Date(dateKey + "-01").toLocaleDateString("th-TH", { year: "numeric", month: "long" });
}

function navDateKey(period: Period, dateKey: string, dir: 1 | -1): string {
  if (period === "DAILY") {
    const d = new Date(dateKey + "T00:00:00");
    d.setDate(d.getDate() + dir);
    return d.toISOString().slice(0, 10);
  }
  if (period === "WEEKLY") {
    const [y, w] = dateKey.split("-W").map(Number);
    const newWeek = w + dir;
    if (newWeek < 1) return `${y - 1}-W52`;
    if (newWeek > 52) return `${y + 1}-W01`;
    return `${y}-W${String(newWeek).padStart(2, "0")}`;
  }
  // MONTHLY
  const [y, m] = dateKey.split("-").map(Number);
  const d = new Date(y, m - 1 + dir, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function TargetsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; dateKey?: string }>;
}) {
  const params = await searchParams;
  const period: Period = (params.period as Period) || "MONTHLY";
  const dateKey = params.dateKey || getCurrentDateKey(period);
  const { start, end } = getDateRange(period, dateKey);
  const today = new Date().toISOString().slice(0, 10);

  // Current month for expense budget (always monthly)
  const currentMonth = today.slice(0, 7);

  const [employees, salesTargets, expenseBudget, actualSales] = await Promise.all([
    prisma.user.findMany({ where: { role: "EMPLOYEE", isActive: true, deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.salesTarget.findMany({ where: { period, dateKey }, include: { user: true } }),
    prisma.expenseBudget.findUnique({ where: { month: currentMonth } }),
    prisma.timeEntry.groupBy({
      by: ["userId"],
      where: { date: { gte: start, lte: end } },
      _sum: { salesAmount: true },
    }),
  ]);

  const totalActual = actualSales.reduce((s, e) => s + (e._sum.salesAmount ?? 0), 0);
  const empSalesMap: Record<string, number> = {};
  for (const e of actualSales) empSalesMap[e.userId] = e._sum.salesAmount ?? 0;

  const overallTarget = salesTargets.find(t => !t.userId);
  const empTargetMap: Record<string, number> = {};
  for (const t of salesTargets) { if (t.userId) empTargetMap[t.userId] = t.amount; }

  const prevKey = navDateKey(period, dateKey, -1);
  const nextKey = navDateKey(period, dateKey, 1);

  const PERIODS: { key: Period; label: string }[] = [
    { key: "DAILY", label: "รายวัน" },
    { key: "WEEKLY", label: "รายสัปดาห์" },
    { key: "MONTHLY", label: "รายเดือน" },
  ];

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[#1A1A1A] pt-2">🎯 ตั้งเป้ายอดขาย</h1>

      {/* Period selector */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl">
        {PERIODS.map(p => (
          <Link key={p.key}
            href={`?period=${p.key}&dateKey=${getCurrentDateKey(p.key)}`}
            className={`flex-1 text-center py-2 rounded-xl text-sm font-semibold transition-all ${period === p.key ? "text-[#1A1A1A] shadow-sm" : "text-gray-500"}`}
            style={period === p.key ? { background: "linear-gradient(135deg, #F5D400, #F5A882)" } : {}}>
            {p.label}
          </Link>
        ))}
      </div>

      {/* Date navigation */}
      <div className="flex items-center gap-2">
        <Link href={`?period=${period}&dateKey=${prevKey}`}
          className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-500 font-bold hover:border-[#F5D400]">
          ‹
        </Link>
        <div className="flex-1 text-center font-semibold text-[#1A1A1A] text-sm">{getLabel(period, dateKey)}</div>
        <Link href={`?period=${period}&dateKey=${nextKey}`}
          className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-500 font-bold hover:border-[#F5D400]">
          ›
        </Link>
      </div>

      {/* Progress bars */}
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
                style={{ width: `${Math.min((totalActual / overallTarget.amount) * 100, 100)}%`, background: totalActual >= overallTarget.amount ? "#22c55e" : "linear-gradient(90deg, #F5D400, #F5A882)" }} />
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {overallTarget.amount > 0 ? ((totalActual / overallTarget.amount) * 100).toFixed(1) : "0"}%
              {totalActual >= overallTarget.amount ? " 🎉 ถึงเป้าแล้ว!" : ""}
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
                  {(emp as { profileImage?: string | null }).profileImage ? (
                    <img src={(emp as { profileImage?: string | null }).profileImage!} alt={emp.name} className="w-full h-full object-cover" />
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
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 100 ? "#22c55e" : "linear-gradient(90deg, #F5D400, #F5A882)" }} />
              </div>
            </div>
          );
        })}
      </div>

      <TargetsForm
        period={period}
        dateKey={dateKey}
        employees={employees.map(e => ({ id: e.id, name: e.name }))}
        overallTarget={overallTarget?.amount ?? null}
        empTargets={empTargetMap}
        expenseBudget={expenseBudget?.amount ?? null}
        currentMonth={currentMonth}
      />
    </div>
  );
}
