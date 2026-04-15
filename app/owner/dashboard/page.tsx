export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatCurrency, getDateRange, PLATFORM_LABELS } from "@/lib/utils";
import DashboardCharts from "./DashboardCharts";

async function getDashboardData(period: "today" | "week" | "month") {
  const { start, end } = getDateRange(period);

  const entries = await prisma.timeEntry.findMany({
    where: { date: { gte: start, lte: end } },
    include: { user: true, session: true },
    orderBy: { createdAt: "desc" },
  });

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

  return {
    totalSales,
    totalEntries,
    byEmployee: Object.values(byEmployee).sort((a, b) => b.total - a.total),
    byPlatform: Object.entries(byPlatform).map(([platform, total]) => ({
      platform: PLATFORM_LABELS[platform] || platform,
      total,
    })),
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
              period === p.key ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500"
            }`}
          >
            {p.label}
          </a>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-4 text-white">
          <div className="text-indigo-200 text-sm font-medium mb-1">ยอดขายรวม</div>
          <div className="text-2xl font-bold">{formatCurrency(data.totalSales)}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
          <div className="text-purple-200 text-sm font-medium mb-1">จำนวนรายการ</div>
          <div className="text-2xl font-bold">{data.totalEntries} รายการ</div>
        </div>
      </div>

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
                    {PLATFORM_LABELS[entry.platform]} · {entry.session?.name || "กำหนดเอง"}
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
