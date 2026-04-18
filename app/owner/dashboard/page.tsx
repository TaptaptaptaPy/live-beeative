export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatCurrency, PLATFORM_LABELS } from "@/lib/utils";
import DashboardCharts from "./DashboardCharts";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { DeltaBadge } from "@/components/ui/Badge";

type Period = "today" | "week" | "month" | "year" | "custom";

function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getCustomDateRange(period: Period, customStart?: string, customEnd?: string) {
  const today = new Date();
  if (period === "today") { const s = fmt(today); return { start: s, end: s }; }
  if (period === "week") {
    const mon = new Date(today);
    mon.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    return { start: fmt(mon), end: fmt(today) };
  }
  if (period === "month") {
    return { start: fmt(new Date(today.getFullYear(), today.getMonth(), 1)), end: fmt(today) };
  }
  if (period === "year") return { start: `${today.getFullYear()}-01-01`, end: fmt(today) };
  return { start: customStart || fmt(today), end: customEnd || fmt(today) };
}

function getPrevDateRange(period: Period, customStart?: string, customEnd?: string) {
  const today = new Date();
  if (period === "today") {
    const d = new Date(today); d.setDate(d.getDate() - 1); const s = fmt(d);
    return { start: s, end: s };
  }
  if (period === "week") {
    const mon = new Date(today); mon.setDate(today.getDate() - ((today.getDay() + 6) % 7) - 7);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return { start: fmt(mon), end: fmt(sun) };
  }
  if (period === "month") {
    const fp = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lp = new Date(today.getFullYear(), today.getMonth(), 0);
    return { start: fmt(fp), end: fmt(lp) };
  }
  if (period === "year") {
    const y = today.getFullYear() - 1;
    return { start: `${y}-01-01`, end: `${y}-12-31` };
  }
  if (customStart && customEnd) {
    const s = new Date(customStart), e = new Date(customEnd);
    const diff = e.getTime() - s.getTime();
    const pe = new Date(s.getTime() - 1), ps = new Date(pe.getTime() - diff);
    return { start: fmt(ps), end: fmt(pe) };
  }
  return { start: fmt(today), end: fmt(today) };
}

async function getDashboardData(period: Period, customStart?: string, customEnd?: string) {
  const { start, end } = getCustomDateRange(period, customStart, customEnd);
  const { start: prevStart, end: prevEnd } = getPrevDateRange(period, customStart, customEnd);

  // Current month key for targets
  const today = new Date();
  const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const [entries, brands, prevEntries, teamTarget] = await Promise.all([
    prisma.timeEntry.findMany({
      where: { date: { gte: start, lte: end } },
      include: { user: true, session: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.brand.findMany({
      where: { isActive: true },
      select: { id: true, name: true, commissionRate: true, color: true },
    }),
    prisma.timeEntry.findMany({
      where: { date: { gte: prevStart, lte: prevEnd } },
      select: { salesAmount: true, brandId: true },
    }),
    // Team-level monthly target (userId = null)
    prisma.salesTarget.findFirst({
      where: { period: "MONTHLY", dateKey: monthKey, userId: null },
      select: { amount: true },
    }),
  ]);

  const totalSales   = entries.reduce((s, e) => s + e.salesAmount, 0);
  const totalEntries = entries.length;

  // Per employee
  const byEmployeeMap: Record<string, { name: string; total: number; count: number }> = {};
  for (const e of entries) {
    if (!byEmployeeMap[e.userId])
      byEmployeeMap[e.userId] = { name: e.user.name, total: 0, count: 0 };
    byEmployeeMap[e.userId].total += e.salesAmount;
    byEmployeeMap[e.userId].count += 1;
  }

  // Per platform
  const byPlatformMap: Record<string, number> = {};
  for (const e of entries) {
    byPlatformMap[e.platform] = (byPlatformMap[e.platform] || 0) + e.salesAmount;
  }

  // Daily trend
  const dailyMap: Record<string, number> = {};
  for (const e of entries) {
    dailyMap[e.date] = (dailyMap[e.date] || 0) + e.salesAmount;
  }
  const dailyTrend = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total]) => ({ date: date.slice(5), total }));

  // Per-brand commission
  const brandMap: Record<string, { name: string; commissionRate: number; color: string }> = {};
  for (const b of brands) brandMap[b.id] = b;

  const byBrandMap: Record<string, { name: string; color: string; sales: number; commission: number }> = {};
  let unbrandedSales = 0;
  for (const e of entries) {
    if (e.brandId && brandMap[e.brandId]) {
      const b = brandMap[e.brandId];
      if (!byBrandMap[e.brandId]) byBrandMap[e.brandId] = { name: b.name, color: b.color, sales: 0, commission: 0 };
      byBrandMap[e.brandId].sales      += e.salesAmount;
      byBrandMap[e.brandId].commission += e.salesAmount * b.commissionRate / 100;
    } else {
      unbrandedSales += e.salesAmount;
    }
  }
  const brandedSales = totalSales - unbrandedSales;
  const totalCommission = Object.values(byBrandMap).reduce((s, b) => s + b.commission, 0);
  const commissionCoverage = totalSales > 0 ? Math.round((brandedSales / totalSales) * 100) : 0;

  // Previous period totals
  const prevTotalSales  = prevEntries.reduce((s, e) => s + e.salesAmount, 0);
  const prevTotalEntries = prevEntries.length;
  const brandRates: Record<string, number> = {};
  for (const b of brands) brandRates[b.id] = b.commissionRate;
  const prevCommission = prevEntries.reduce(
    (s, e) => s + (e.brandId && brandRates[e.brandId] ? e.salesAmount * brandRates[e.brandId] / 100 : 0), 0
  );

  function delta(curr: number, prev: number) {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  }

  // Month-to-date sales for target (always this month regardless of period filter)
  const mtdSales = period === "month" ? totalSales : (await prisma.timeEntry.aggregate({
    _sum: { salesAmount: true },
    where: { date: { gte: `${monthKey}-01`, lte: fmt(today) } },
  }))._sum.salesAmount ?? 0;

  return {
    totalSales, totalEntries, totalCommission,
    brandedSales, unbrandedSales, commissionCoverage,
    prevTotalSales, prevTotalEntries, prevCommission,
    salesDelta:      delta(totalSales, prevTotalSales),
    entriesDelta:    delta(totalEntries, prevTotalEntries),
    commissionDelta: delta(totalCommission, prevCommission),
    byEmployee: Object.values(byEmployeeMap).sort((a, b) => b.total - a.total),
    byPlatform: Object.entries(byPlatformMap)
      .map(([platform, total]) => ({
        platform: PLATFORM_LABELS[platform] || platform,
        key: platform,
        total,
      }))
      .sort((a, b) => b.total - a.total),
    byBrand: Object.values(byBrandMap).sort((a, b) => b.commission - a.commission),
    dailyTrend,
    recentEntries: entries.slice(0, 5),
    teamTarget: teamTarget?.amount ?? null,
    mtdSales,
    monthKey,
  };
}

// Platform display config
const PLATFORM_META: Record<string, { emoji: string; color: string }> = {
  TIKTOK:   { emoji: "🎵", color: "#FF004F" },
  SHOPEE:   { emoji: "🛒", color: "#EE4D2D" },
  FACEBOOK: { emoji: "📘", color: "#1877F2" },
  OTHER:    { emoji: "📱", color: "#6B7280" },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; startDate?: string; endDate?: string }>;
}) {
  const { period: rawPeriod, startDate, endDate } = await searchParams;
  const period = (rawPeriod as Period) || "today";
  const data = await getDashboardData(period, startDate, endDate);

  const PERIODS = [
    { key: "today",  label: "วันนี้" },
    { key: "week",   label: "สัปดาห์นี้" },
    { key: "month",  label: "เดือนนี้" },
    { key: "year",   label: "ปีนี้" },
    { key: "custom", label: "กำหนดเอง" },
  ];

  const prevLabel = period === "today" ? "เมื่อวาน"
    : period === "week"  ? "สัปดาห์ก่อน"
    : period === "month" ? "เดือนก่อน"
    : period === "year"  ? "ปีก่อน"
    : "ช่วงก่อนหน้า";

  const today    = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  const firstOfMonth = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-01`;

  // Target progress
  const targetPct = data.teamTarget && data.teamTarget > 0
    ? Math.min(Math.round((data.mtdSales / data.teamTarget) * 100), 100)
    : null;

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">📊 Dashboard</h1>
          {data.prevTotalSales > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              เทียบ{prevLabel} · {formatCurrency(data.prevTotalSales)}
            </p>
          )}
        </div>
      </div>

      {/* Period tabs */}
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex gap-1.5 bg-gray-100 dark:bg-[#1A1A1A] p-1 rounded-2xl min-w-max border border-transparent dark:border-[#2A2A2A]">
          {PERIODS.map((p) => (
            <a
              key={p.key}
              href={`?period=${p.key}`}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                period === p.key
                  ? "text-[#1A1A1A] shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
              style={period === p.key ? { background: "linear-gradient(135deg, #F5D400, #F5A882)" } : {}}
            >
              {p.label}
            </a>
          ))}
        </div>
      </div>

      {/* Custom date picker */}
      {period === "custom" && (
        <form method="GET" action=""
          className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-4 border border-[#E5E7EB] dark:border-[#2A2A2A] space-y-3">
          <input type="hidden" name="period" value="custom" />
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-sm text-gray-600 dark:text-gray-400 font-medium w-full sm:w-auto">ช่วงวันที่</label>
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              <input type="date" name="startDate" defaultValue={startDate || firstOfMonth} max={todayStr}
                className="flex-1 min-w-0 border border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#242424] text-gray-700 dark:text-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5D400]" />
              <span className="text-gray-400 text-sm">ถึง</span>
              <input type="date" name="endDate" defaultValue={endDate || todayStr} max={todayStr}
                className="flex-1 min-w-0 border border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#242424] text-gray-700 dark:text-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5D400]" />
            </div>
            <button type="submit"
              className="px-5 py-2 rounded-xl text-sm font-semibold text-[#1A1A1A] shadow-sm whitespace-nowrap"
              style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}>
              ดู
            </button>
          </div>
        </form>
      )}

      {/* ═══ DESKTOP: 2-column grid ═══ */}
      <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0">

        {/* ── LEFT COLUMN ── */}
        <div className="space-y-4">

          {/* Hero stat cards */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="ยอดขายรวม"
              value={formatCurrency(data.totalSales)}
              sub={`${data.totalEntries} รายการ`}
              delta={data.prevTotalSales > 0 ? data.salesDelta : undefined}
              icon="💰"
              variant="yellow"
              sparkline={data.dailyTrend.map((d) => d.total)}
            />
            <StatCard
              label="จำนวนรายการ"
              value={data.totalEntries}
              sub={`ก่อนหน้า ${data.prevTotalEntries}`}
              delta={data.prevTotalEntries > 0 ? data.entriesDelta : undefined}
              icon="📝"
              variant="blue"
            />
          </div>

          {/* Commission card */}
          {data.totalCommission > 0 && (
            <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-4 border-l-4 border-green-400 border border-[#E5E7EB] dark:border-[#2A2A2A]" style={{ borderLeftColor: "#22c55e" }}>
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">💎 รายได้จริง (Commission รวม)</div>
                {data.prevCommission > 0 && <DeltaBadge delta={data.commissionDelta} />}
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(data.totalCommission)}</div>
              {data.unbrandedSales > 0 && (
                <div className="mt-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 rounded-lg px-2 py-1.5">
                  ⚠️ มียอดไม่ระบุแบรนด์ {formatCurrency(data.unbrandedSales)} — ยังไม่นับ commission
                </div>
              )}
            </div>
          )}

          {/* Monthly target progress (always shows this month's MTD) */}
          {data.teamTarget !== null && (
            <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-4 border border-[#E5E7EB] dark:border-[#2A2A2A]">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-bold text-gray-800 dark:text-white">🎯 เป้าเดือนนี้ (ทีม)</div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  (targetPct ?? 0) >= 100
                    ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                    : (targetPct ?? 0) >= 70
                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400"
                    : "bg-gray-100 text-gray-500 dark:bg-[#2A2A2A] dark:text-gray-400"
                }`}>
                  {targetPct ?? 0}%
                </span>
              </div>
              <div className="h-3 bg-gray-100 dark:bg-[#2A2A2A] rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${targetPct ?? 0}%`,
                    background: (targetPct ?? 0) >= 100
                      ? "linear-gradient(90deg,#22c55e,#16a34a)"
                      : "linear-gradient(90deg,#F5D400,#F5A882)",
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
                <span>MTD {formatCurrency(data.mtdSales)}</span>
                <span>เป้า {formatCurrency(data.teamTarget)}</span>
              </div>
            </div>
          )}

          {/* Leaderboard */}
          <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-4 border border-[#E5E7EB] dark:border-[#2A2A2A]">
            <h2 className="font-bold text-gray-800 dark:text-white mb-3">🏆 ยอดขายตามพนักงาน</h2>
            {data.byEmployee.length === 0 ? (
              <EmptyState icon="👤" title="ยังไม่มีข้อมูล" compact />
            ) : (
              <div className="space-y-3">
                {data.byEmployee.map((emp, i) => {
                  const maxTotal = data.byEmployee[0]?.total || 1;
                  const pct = (emp.total / maxTotal) * 100;
                  return (
                    <div key={emp.name}>
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{["🥇","🥈","🥉"][i] || "👤"}</span>
                          <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">{emp.name}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">{emp.count} รายการ</span>
                        </div>
                        <span className="font-bold text-gray-800 dark:text-white text-sm">{formatCurrency(emp.total)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-[#2A2A2A] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            background: i === 0
                              ? "linear-gradient(90deg,#F5D400,#F5A882)"
                              : i === 1 ? "#A1A1AA" : "#71717A"
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
        {/* ── END LEFT COLUMN ── */}

        {/* ── RIGHT COLUMN ── */}
        <div className="space-y-4">

          {/* Charts */}
          <DashboardCharts
            byEmployee={data.byEmployee}
            byPlatform={data.byPlatform}
            dailyTrend={data.dailyTrend}
            period={period}
          />

          {/* Platform breakdown */}
          <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-4 border border-[#E5E7EB] dark:border-[#2A2A2A]">
            <h2 className="font-bold text-gray-800 dark:text-white mb-3">📱 ยอดขายตาม Platform</h2>
            {data.byPlatform.length === 0 ? (
              <EmptyState icon="📱" title="ยังไม่มีข้อมูล" compact />
            ) : (
              <div className="space-y-2">
                {data.byPlatform.map((p) => {
                  const meta = PLATFORM_META[p.key] ?? { emoji: "📱", color: "#6B7280" };
                  const maxTotal = data.byPlatform[0]?.total || 1;
                  const pct = Math.round((p.total / maxTotal) * 100);
                  return (
                    <div key={p.platform}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          {meta.emoji} {p.platform}
                        </span>
                        <span className="font-bold text-gray-800 dark:text-white text-sm">{formatCurrency(p.total)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-[#2A2A2A] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: meta.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Brand breakdown */}
          {(data.byBrand.length > 0 || data.unbrandedSales > 0) && (
            <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-4 border border-[#E5E7EB] dark:border-[#2A2A2A]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-800 dark:text-white">🏷️ รายได้ตามแบรนด์</h2>
                {data.unbrandedSales > 0 && data.byBrand.length > 0 && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-[#2A2A2A] px-2 py-0.5 rounded-full">
                    ติดตาม {data.commissionCoverage}%
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {data.byBrand.map((b, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-[#2A2A2A] last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: b.color }} />
                      <span className="text-gray-700 dark:text-gray-200 text-sm font-medium">{b.name}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{formatCurrency(b.sales)}</span>
                    </div>
                    <span className="font-bold text-green-600 dark:text-green-400 text-sm">{formatCurrency(b.commission)}</span>
                  </div>
                ))}
                {data.unbrandedSales > 0 && (
                  <div className="flex items-center justify-between py-1.5 opacity-50">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                      <span className="text-gray-500 dark:text-gray-400 text-sm">ไม่ระบุแบรนด์</span>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 italic">—</span>
                  </div>
                )}
              </div>
              {data.unbrandedSales > 0 && data.byBrand.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-[#2A2A2A]">
                  <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                    <div className="bg-green-400 h-full transition-all" style={{ width: `${data.commissionCoverage}%` }} />
                    <div className="bg-gray-200 dark:bg-[#2A2A2A] h-full flex-1" />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
                    <span>ระบุแบรนด์ {formatCurrency(data.brandedSales)}</span>
                    <span>ไม่ระบุ {formatCurrency(data.unbrandedSales)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recent entries */}
          <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-4 border border-[#E5E7EB] dark:border-[#2A2A2A]">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold text-gray-800 dark:text-white">🕐 รายการล่าสุด</h2>
              <a href="/owner/entries" className="text-[#F5D400] text-sm font-medium hover:opacity-80">ดูทั้งหมด →</a>
            </div>
            {data.recentEntries.length === 0 ? (
              <EmptyState icon="📋" title="ยังไม่มีรายการ" compact />
            ) : (
              <div className="space-y-2">
                {data.recentEntries.map((entry) => {
                  const meta = PLATFORM_META[entry.platform] ?? { emoji: "📱", color: "#6B7280" };
                  return (
                    <div key={entry.id} className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-[#2A2A2A] last:border-0">
                      <div>
                        <div className="font-medium text-gray-700 dark:text-gray-200 text-sm">{entry.user.name}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {meta.emoji} {PLATFORM_LABELS[entry.platform]} · {entry.session?.name || "กำหนดเอง"}
                        </div>
                      </div>
                      <span className="font-bold text-green-600 dark:text-green-400 text-sm">{formatCurrency(entry.salesAmount)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
        {/* ── END RIGHT COLUMN ── */}

      </div>
    </div>
  );
}
