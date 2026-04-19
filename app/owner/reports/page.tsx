export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatCurrency, PLATFORM_LABELS } from "@/lib/utils";
import { PlatformBadge } from "@/components/ui/PlatformBadge";
import ReportsCharts from "./ReportsCharts";
import DailyExportButton from "./DailyExportButton";

type Granularity = "session" | "day" | "week" | "month";

function getWeekKey(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const mon = new Date(d);
  mon.setDate(d.getDate() - ((day + 6) % 7));
  return mon.toISOString().slice(0, 10);
}

function getMonthKey(dateStr: string) {
  return dateStr.slice(0, 7);
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    startDate?: string; endDate?: string; granularity?: string;
    userId?: string; platform?: string;
  }>;
}) {
  const params = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 7) + "-01";

  const startDate = params.startDate || firstOfMonth;
  const endDate = params.endDate || today;
  const granularity = (params.granularity as Granularity) || "day";
  const userId = params.userId || "";
  const platform = params.platform || "";

  const [entries, bulkEntries, employees, sessions] = await Promise.all([
    prisma.timeEntry.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        ...(userId ? { userId } : {}),
        ...(platform ? { platform: platform as "TIKTOK" | "SHOPEE" | "FACEBOOK" | "OTHER" } : {}),
      },
      include: { user: true, session: true },
      orderBy: { date: "asc" },
    }),
    prisma.bulkEntry.findMany({
      where: {
        startDate: { lte: endDate },
        endDate: { gte: startDate },
        ...(userId ? { userId } : {}),
        ...(platform ? { platform: platform as "TIKTOK" | "SHOPEE" | "FACEBOOK" | "OTHER" } : {}),
      },
      include: { user: true },
    }),
    prisma.user.findMany({ where: { role: "EMPLOYEE" }, orderBy: { name: "asc" } }),
    prisma.liveSession.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  const totalSales = entries.reduce((s, e) => s + e.salesAmount, 0);
  const totalBulk = bulkEntries.reduce((s, e) => s + e.totalSales, 0);
  const grandTotal = totalSales + totalBulk;

  const grouped: Record<string, number> = {};

  if (granularity === "session") {
    for (const e of entries) {
      const key = e.session?.name || (e.customStart ? `${e.customStart}–${e.customEnd}` : "ไม่ระบุ");
      grouped[key] = (grouped[key] || 0) + e.salesAmount;
    }
  } else if (granularity === "day") {
    for (const e of entries) grouped[e.date] = (grouped[e.date] || 0) + e.salesAmount;
  } else if (granularity === "week") {
    for (const e of entries) {
      const k = getWeekKey(e.date);
      grouped[k] = (grouped[k] || 0) + e.salesAmount;
    }
  } else if (granularity === "month") {
    for (const e of entries) {
      const k = getMonthKey(e.date);
      grouped[k] = (grouped[k] || 0) + e.salesAmount;
    }
  }

  const chartData = Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, total]) => ({ key, total }));

  const byPlatform: Record<string, number> = {};
  for (const e of entries) byPlatform[e.platform] = (byPlatform[e.platform] || 0) + e.salesAmount;

  const byEmployee: Record<string, { name: string; total: number; count: number }> = {};
  for (const e of entries) {
    if (!byEmployee[e.userId]) byEmployee[e.userId] = { name: e.user.name, total: 0, count: 0 };
    byEmployee[e.userId].total += e.salesAmount;
    byEmployee[e.userId].count++;
  }

  const GRANULARITY_OPTIONS = [
    { value: "session", label: "ช่วงเวลา" },
    { value: "day",     label: "รายวัน" },
    { value: "week",    label: "รายสัปดาห์" },
    { value: "month",   label: "รายเดือน" },
  ];

  const PRESETS = [
    { label: "วันนี้",        start: today,              end: today },
    { label: "สัปดาห์นี้",    start: getWeekKey(today),  end: today },
    { label: "เดือนนี้",      start: firstOfMonth,       end: today },
    { label: "3 เดือนที่ผ่านมา", start: (() => { const d = new Date(); d.setMonth(d.getMonth()-3); return d.toISOString().slice(0,10); })(), end: today },
    { label: "ปีนี้",         start: today.slice(0,4)+"-01-01", end: today },
  ];

  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams({ startDate, endDate, granularity, userId, platform, ...overrides });
    return `/owner/reports?${p.toString()}`;
  }

  const inputCls = "w-full border border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#242424] text-gray-700 dark:text-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5D400]";
  const card = "bg-white dark:bg-[#1A1A1A] rounded-2xl border border-[#E5E7EB] dark:border-[#2A2A2A]";

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto animate-fade-in">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white pt-2">📊 รายงานละเอียด</h1>

      <DailyExportButton />

      {/* Presets */}
      <div className="flex gap-2 flex-wrap">
        {PRESETS.map(p => (
          <a key={p.label} href={buildUrl({ startDate: p.start, endDate: p.end })}
            className={`text-sm px-3 py-1.5 rounded-xl font-medium transition-all border-2 ${
              startDate === p.start && endDate === p.end
                ? "border-[#F5D400] bg-[#FFF8CC] dark:bg-[#2A2200] text-gray-900 dark:text-[#F5D400]"
                : "border-gray-200 dark:border-[#2A2A2A] text-gray-600 dark:text-gray-300 bg-white dark:bg-[#1A1A1A]"
            }`}>
            {p.label}
          </a>
        ))}
      </div>

      {/* Filters */}
      <form method="GET" action="/owner/reports" className={`${card} p-4 space-y-3`}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">วันที่เริ่ม</label>
            <input type="date" name="startDate" defaultValue={startDate} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">วันที่สิ้นสุด</label>
            <input type="date" name="endDate" defaultValue={endDate} className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">พนักงาน</label>
            <select name="userId" defaultValue={userId} className={inputCls}>
              <option value="">ทั้งหมด</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Platform</label>
            <select name="platform" defaultValue={platform} className={inputCls}>
              <option value="">ทั้งหมด</option>
              {Object.entries(PLATFORM_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 block mb-2">แสดงผลแบบ</label>
          <div className="grid grid-cols-4 gap-2">
            {GRANULARITY_OPTIONS.map(g => (
              <label key={g.value}
                className={`flex items-center justify-center p-2 rounded-xl border-2 cursor-pointer text-xs font-medium transition-all ${
                  granularity === g.value
                    ? "border-[#F5D400] bg-[#FFF8CC] dark:bg-[#2A2200] text-gray-900 dark:text-[#F5D400]"
                    : "border-gray-200 dark:border-[#2A2A2A] text-gray-600 dark:text-gray-400"
                }`}>
                <input type="radio" name="granularity" value={g.value}
                  defaultChecked={granularity === g.value} className="sr-only" />
                {g.label}
              </label>
            ))}
          </div>
        </div>
        <button type="submit"
          className="w-full h-10 rounded-xl font-semibold text-sm text-[#1A1A1A]"
          style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}>
          ค้นหา / อัปเดต
        </button>
      </form>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className={`${card} p-3 border-l-[3px] border-l-[#F5D400]`}>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">ยอดรายการ</div>
          <div className="font-bold text-gray-900 dark:text-white">{formatCurrency(totalSales)}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500">{entries.length} รายการ</div>
        </div>
        <div className={`${card} p-3 border-l-[3px] border-l-orange-400`}>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">ยอดย้อนหลัง</div>
          <div className="font-bold text-gray-900 dark:text-white">{formatCurrency(totalBulk)}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500">{bulkEntries.length} รายการ</div>
        </div>
        <div className={`${card} p-3 border-l-[3px] border-l-green-400`}>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">รวมทั้งหมด</div>
          <div className="font-bold text-green-600 dark:text-green-400">{formatCurrency(grandTotal)}</div>
        </div>
      </div>

      {/* Charts */}
      <ReportsCharts chartData={chartData} byPlatform={
        Object.entries(byPlatform).map(([p, t]) => ({ name: PLATFORM_LABELS[p] || p, total: t }))
      } granularity={granularity} />

      {/* Employee leaderboard */}
      <div className={`${card} p-4`}>
        <h2 className="font-bold text-gray-900 dark:text-white mb-3">🏆 Leaderboard พนักงาน</h2>
        {Object.values(byEmployee).length === 0 ? (
          <p className="text-gray-400 dark:text-gray-500 text-center py-4">ไม่มีข้อมูลในช่วงนี้</p>
        ) : (
          <div className="space-y-3">
            {Object.values(byEmployee).sort((a, b) => b.total - a.total).map((emp, i) => {
              const max = Math.max(...Object.values(byEmployee).map(e => e.total), 1);
              const MEDALS = ["🥇", "🥈", "🥉"];
              return (
                <div key={emp.name}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{MEDALS[i] || "👤"}</span>
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">{emp.name}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{emp.count} รายการ</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(emp.total)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-[#2A2A2A] rounded-full overflow-hidden">
                    <div className="h-full rounded-full"
                      style={{ width: `${(emp.total / max) * 100}%`, background: "linear-gradient(90deg, #F5D400, #F5A882)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail table */}
      <div className={`${card} p-4`}>
        <h2 className="font-bold text-gray-900 dark:text-white mb-3">📋 รายการทั้งหมด</h2>
        {entries.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-500 text-center py-4">ไม่มีข้อมูลในช่วงนี้</p>
        ) : (
          <>
          <div className="relative">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="text-left border-b-2 border-[#F5D400]">
                <th className="pb-2 font-semibold text-gray-900 dark:text-white">วันที่</th>
                <th className="pb-2 font-semibold text-gray-900 dark:text-white">พนักงาน</th>
                <th className="pb-2 font-semibold text-gray-900 dark:text-white">Platform</th>
                <th className="pb-2 font-semibold text-gray-900 dark:text-white">ช่วงเวลา</th>
                <th className="pb-2 font-semibold text-gray-900 dark:text-white text-right">ยอด</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id} className="border-b border-gray-50 dark:border-[#222] hover:bg-[#FFFBEB] dark:hover:bg-[#1C1800] transition-colors">
                  <td className="py-2 text-gray-600 dark:text-gray-300">
                    {e.date}
                    {e.isBackdated && <span className="ml-1 text-xs text-orange-400">(ย้อน)</span>}
                  </td>
                  <td className="py-2 font-medium text-gray-900 dark:text-white">{e.user.name}</td>
                  <td className="py-2"><PlatformBadge platform={e.platform} size="xs" /></td>
                  <td className="py-2 text-gray-500 dark:text-gray-400 text-xs">{e.session?.name || "กำหนดเอง"}</td>
                  <td className="py-2 font-bold text-green-600 dark:text-green-400 text-right">{formatCurrency(e.salesAmount)}</td>
                </tr>
              ))}
              <tr className="bg-[#FFF8CC] dark:bg-[#1C1800]">
                <td colSpan={4} className="py-2 font-bold text-gray-900 dark:text-[#F5D400] px-1">รวม</td>
                <td className="py-2 font-bold text-gray-900 dark:text-white text-right">{formatCurrency(totalSales)}</td>
              </tr>
            </tbody>
          </table>
          </div>
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-[#1A1A1A] to-transparent md:hidden" />
          </div>
          <p className="text-[10px] text-gray-300 dark:text-gray-700 mt-1 text-right md:hidden">← เลื่อนดูเพิ่มเติม</p>
          </>
        )}
      </div>
    </div>
  );
}
