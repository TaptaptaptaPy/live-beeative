export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatCurrency, getDateRange, PLATFORM_LABELS } from "@/lib/utils";
import DashboardCharts from "./DashboardCharts";

function getPrevDateRange(period: "today" | "week" | "month"): { start: string; end: string } {
  const today = new Date();
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  if (period === "today") {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    const s = fmt(d);
    return { start: s, end: s };
  }
  if (period === "week") {
    const day = today.getDay();
    const mon = new Date(today);
    mon.setDate(today.getDate() - ((day + 6) % 7) - 7);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return { start: fmt(mon), end: fmt(sun) };
  }
  const firstDayPrev = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastDayPrev = new Date(today.getFullYear(), today.getMonth(), 0);
  return { start: fmt(firstDayPrev), end: fmt(lastDayPrev) };
}

async function getDashboardData(period: "today" | "week" | "month") {
  const { start, end } = getDateRange(period);
  const { start: prevStart, end: prevEnd } = getPrevDateRange(period);

  const [entries, brands, prevEntries] = await Promise.all([
    prisma.timeEntry.findMany({
      where: { date: { gte: start, lte: end } },
      include: { user: true, session: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.brand.findMany({ where: { isActive: true }, select: { id: true, name: true, commissionRate: true, color: true } }),
    prisma.timeEntry.findMany({
      where: { date: { gte: prevStart, lte: prevEnd } },
      select: { salesAmount: true, brandId: true },
    }),
  ]);

  const totalSales = entries.reduce((s, e) => s + e.salesAmount, 0);
  const totalEntries = entries.length;

  // Per employee
  const byEmployee: Record<string, { name: string; total: number; count: number }> = {};
  for (const e of entries) {
    if (!byEmployee[e.userId]) byEmployee[e.userId] = { name: e.user.name, total: 0, count: 0 };
    byEmployee[e.userId].total += e.salesAmount;
    byEmployee[e.userId].count += 1;
  }

  // Per platform
  const byPlatform: Record<string, number> = {};
  for (const e of entries) {
    byPlatform[e.platform] = (byPlatform[e.platform] || 0) + e.salesAmount;
  }

  // Daily trend (last 7 days for week/month, or just today)
  const dailyMap: Record<string, number> = {};
  for (const e of entries) {
    dailyMap[e.date] = (dailyMap[e.date] || 0) + e.salesAmount;
  }

  const dailyTrend = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total]) => ({
      date: date.slice(5), // MM-DD
      total,
    }));

  // Per-brand commission
  const brandMap: Record<string, { name: string; commissionRate: number; color: string }> = {};
  for (const b of brands) brandMap[b.id] = b;

  const byBrand: Record<string, { name: string; color: string; sales: number; commission: number }> = {};
  let unbrandedSales = 0;
  for (const e of entries) {
    if (e.brandId && brandMap[e.brandId]) {
      const b = brandMap[e.brandId];
      if (!byBrand[e.brandId]) byBrand[e.brandId] = { name: b.name, color: b.color, sales: 0, commission: 0 };
      byBrand[e.brandId].sales += e.salesAmount;
      byBrand[e.brandId].commission += e.salesAmount * b.commissionRate / 100;
    } else {
      unbrandedSales += e.salesAmount;
    }
  }
  const brandedSales = totalSales - unbrandedSales;
  const totalCommission = Object.values(byBrand).reduce((s, b) => s + b.commission, 0);
  const commissionCoverage = totalSales > 0 ? Math.round((brandedSales / totalSales) * 100) : 0;

  // Previous period
  const prevTotalSales = prevEntries.reduce((s, e) => s + e.salesAmount, 0);
  const prevTotalEntries = prevEntries.length;
  const brandMapForPrev: Record<string, number> = {};
  for (const b of brands) brandMapForPrev[b.id] = b.commissionRate;
  const prevCommission = prevEntries.reduce((s, e) => {
    if (e.brandId && brandMapForPrev[e.brandId]) return s + e.salesAmount * brandMapForPrev[e.brandId] / 100;
    return s;
  }, 0);

  function delta(curr: number, prev: number) {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  }

  return {
    totalSales,
    totalEntries,
    totalCommission,
    brandedSales,
    unbrandedSales,
    commissionCoverage,
    prevTotalSales,
    prevTotalEntries,
    prevCommission,
    salesDelta: delta(totalSales, prevTotalSales),
    entriesDelta: delta(totalEntries, prevTotalEntries),
    commissionDelta: delta(totalCommission, prevCommission),
    byEmployee: Object.values(byEmployee).sort((a, b) => b.total - a.total),
    byPlatform: Object.entries(byPlatform).map(([platform, total]) => ({
      platform: PLATFORM_LABELS[platform] || platform,
      total,
    })),
    byBrand: Object.values(byBrand).sort((a, b) => b.commission - a.commission),
    dailyTrend,
    recentEntries: entries.slice(0, 5),
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: rawPeriod } = await searchParams;
  const period = (rawPeriod as "today" | "week" | "month") || "today";
  const data = await getDashboardData(period);

  const PERIODS = [
    { key: "today", label: "วันนี้" },
    { key: "week", label: "สัปดาห์นี้" },
    { key: "month", label: "เดือนนี้" },
  ];

  const PLATFORM_EMOJI: Record<string, string> = { TIKTOK: "🎵", SHOPEE: "🛒", FACEBOOK: "📘", OTHER: "📱" };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 pt-2">Dashboard</h1>

      {/* Period selector */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl">
        {PERIODS.map((p) => (
          <a
            key={p.key}
            href={`?period=${p.key}`}
            className={`flex-1 text-center py-2 rounded-xl text-sm font-semibold transition-all ${
              period === p.key ? "text-[#1A1A1A] shadow-sm" : "text-gray-500"
            }`}
            style={period === p.key ? { background: "linear-gradient(135deg, #F5D400, #F5A882)" } : {}}
          >
            {p.label}
          </a>
        ))}
      </div>

      {/* Period label */}
      {data.prevTotalSales > 0 && (
        <div className="text-xs text-gray-400 text-right -mb-2">
          เทียบกับ{period === "today" ? "เมื่อวาน" : period === "week" ? "สัปดาห์ก่อน" : "เดือนก่อน"} ({formatCurrency(data.prevTotalSales)})
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between mb-1">
            <div className="text-indigo-200 text-sm font-medium">ยอดขายรวม</div>
            {data.prevTotalSales > 0 && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-lg ${data.salesDelta >= 0 ? "bg-green-400/30 text-green-200" : "bg-red-400/30 text-red-200"}`}>
                {data.salesDelta >= 0 ? "▲" : "▼"}{Math.abs(data.salesDelta)}%
              </span>
            )}
          </div>
          <div className="text-xl font-bold">{formatCurrency(data.totalSales)}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between mb-1">
            <div className="text-purple-200 text-sm font-medium">จำนวนรายการ</div>
            {data.prevTotalEntries > 0 && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-lg ${data.entriesDelta >= 0 ? "bg-green-400/30 text-green-200" : "bg-red-400/30 text-red-200"}`}>
                {data.entriesDelta >= 0 ? "▲" : "▼"}{Math.abs(data.entriesDelta)}%
              </span>
            )}
          </div>
          <div className="text-xl font-bold">{data.totalEntries}</div>
        </div>
      </div>
      {data.totalCommission > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-green-400">
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs text-gray-500">รายได้จริง (Commission รวมทุกแบรนด์)</div>
            {data.prevCommission > 0 && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-lg ${data.commissionDelta >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                {data.commissionDelta >= 0 ? "▲" : "▼"}{Math.abs(data.commissionDelta)}%
              </span>
            )}
          </div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(data.totalCommission)}</div>
          {data.unbrandedSales > 0 && (
            <div className="mt-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1.5">
              ⚠️ มียอดขายที่ไม่ระบุแบรนด์ {formatCurrency(data.unbrandedSales)} ({100 - data.commissionCoverage}%) — ยังไม่นับ commission
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      <DashboardCharts
        byEmployee={data.byEmployee}
        byPlatform={data.byPlatform}
        dailyTrend={data.dailyTrend}
        period={period}
      />

      {/* Employee leaderboard */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-3">🏆 ยอดขายตามพนักงาน</h2>
        {data.byEmployee.length === 0 ? (
          <p className="text-gray-400 text-center py-4">ยังไม่มีข้อมูล</p>
        ) : (
          <div className="space-y-3">
            {data.byEmployee.map((emp, i) => {
              const maxTotal = data.byEmployee[0]?.total || 1;
              const pct = (emp.total / maxTotal) * 100;
              return (
                <div key={emp.name}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{["🥇", "🥈", "🥉"][i] || "👤"}</span>
                      <span className="font-medium text-gray-700">{emp.name}</span>
                      <span className="text-xs text-gray-400">{emp.count} รายการ</span>
                    </div>
                    <span className="font-bold text-gray-800">{formatCurrency(emp.total)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-400 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Platform breakdown */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-3">📱 ยอดขายตาม Platform</h2>
        {data.byPlatform.length === 0 ? (
          <p className="text-gray-400 text-center py-4">ยังไม่มีข้อมูล</p>
        ) : (
          <div className="space-y-2">
            {data.byPlatform.map((p) => (
              <div key={p.platform} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <span className="font-medium text-gray-700">{p.platform}</span>
                <span className="font-bold text-gray-800">{formatCurrency(p.total)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Brand breakdown */}
      {(data.byBrand.length > 0 || data.unbrandedSales > 0) && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800">🏷️ รายได้ตามแบรนด์</h2>
            {data.unbrandedSales > 0 && data.byBrand.length > 0 && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                ติดตาม {data.commissionCoverage}%
              </span>
            )}
          </div>
          <div className="space-y-2">
            {data.byBrand.map((b, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: b.color }} />
                  <span className="text-gray-700 font-medium">{b.name}</span>
                  <span className="text-xs text-gray-400">{formatCurrency(b.sales)}</span>
                </div>
                <span className="font-bold text-green-600">{formatCurrency(b.commission)}</span>
              </div>
            ))}
            {data.unbrandedSales > 0 && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 opacity-60">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                  <span className="text-gray-500 font-medium">ไม่ระบุแบรนด์</span>
                  <span className="text-xs text-gray-400">{formatCurrency(data.unbrandedSales)}</span>
                </div>
                <span className="text-xs text-gray-400 italic">ไม่ทราบ commission</span>
              </div>
            )}
          </div>
          {data.unbrandedSales > 0 && data.byBrand.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                <div className="bg-green-400 h-full transition-all" style={{ width: `${data.commissionCoverage}%` }} />
                <div className="bg-gray-200 h-full flex-1" />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>ระบุแบรนด์ {formatCurrency(data.brandedSales)}</span>
                <span>ไม่ระบุ {formatCurrency(data.unbrandedSales)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent entries */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-gray-800">🕐 รายการล่าสุด</h2>
          <a href="/owner/entries" className="text-indigo-500 text-sm">ดูทั้งหมด →</a>
        </div>
        {data.recentEntries.length === 0 ? (
          <p className="text-gray-400 text-center py-4">ยังไม่มีข้อมูล</p>
        ) : (
          <div className="space-y-2">
            {data.recentEntries.map((entry) => (
              <div key={entry.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <div>
                  <div className="font-medium text-gray-700">{entry.user.name}</div>
                  <div className="text-xs text-gray-400">
                    {PLATFORM_EMOJI[entry.platform] || ""} {PLATFORM_LABELS[entry.platform]} · {entry.session?.name || "กำหนดเอง"}
                  </div>
                </div>
                <span className="font-bold text-green-600">{formatCurrency(entry.salesAmount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
