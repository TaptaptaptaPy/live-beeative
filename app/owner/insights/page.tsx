export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatCurrency, PLATFORM_LABELS } from "@/lib/utils";
import InsightsTrendChart from "./InsightsTrendChart";
import ExportButton from "./ExportButton";

const PLATFORM_EMOJI: Record<string, string> = {
  TIKTOK: "🎵", SHOPEE: "🛒", FACEBOOK: "📘", OTHER: "📱",
};

// ── Time helpers ───────────────────────────────────────────
function toHours(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h === 0 && m === 0) ? 24 : h + m / 60; // 00:00 = เที่ยงคืน = 24
}

function fmtTime(t: string): string {
  if (t === "00:00" || t === "24:00") return "00:00";
  return t;
}

function slotHours(start: string, end: string): number {
  const s = toHours(start);
  const e = toHours(end);
  return e > s ? e - s : 1;
}

// คำนวณ overlap กับ เช้า (09–16) และ เย็น (16–24) เป็นชั่วโมง
function calcOverlap(start: string, end: string): { morning: number; evening: number } {
  const s = toHours(start);
  const e = toHours(end);
  const morning = Math.max(0, Math.min(e, 16) - Math.max(s, 9));
  const evening = Math.max(0, Math.min(e, 24) - Math.max(s, 16));
  return { morning, evening };
}

type OverlapType = "☀️ เช้า" | "🌙 เย็น" | "⚠️ คาบเกี่ยว" | "นอกกรอบ";

function getOverlapType(start: string, end: string): OverlapType {
  const { morning, evening } = calcOverlap(start, end);
  if (morning > 0 && evening > 0) return "⚠️ คาบเกี่ยว";
  if (morning > 0) return "☀️ เช้า";
  if (evening > 0) return "🌙 เย็น";
  return "นอกกรอบ";
}

// Timeline: แสดง 06:00–24:00 = 18 ชม.
const TL_START = 6;
const TL_END = 24;
const TL_HOURS = TL_END - TL_START;
function tlPct(hour: number): string {
  const clamped = Math.max(TL_START, Math.min(TL_END, hour));
  return `${((clamped - TL_START) / TL_HOURS) * 100}%`;
}
function tlWidth(from: number, to: number): string {
  const clamped = Math.max(0, Math.min(to, TL_END) - Math.max(from, TL_START));
  return `${(clamped / TL_HOURS) * 100}%`;
}

// ── Types ──────────────────────────────────────────────────
type PlatStat = { name: string; count: number; total: number; avg: number };
type EmpStat = {
  name: string; total: number; count: number;
  slots: Record<string, number>; platforms: Record<string, number>;
};
type CustomRange = {
  key: string; start: string; end: string;
  count: number; total: number; avg: number;
  hours: number; avgPerHour: number;
  overlap: OverlapType;
  morningHrs: number; eveningHrs: number;
};
type CompItem = {
  label: string; sublabel?: string; count: number; total: number;
  avg: number; avgPerHour: number; isFixed: boolean; isBest?: boolean;
  startH?: number; endH?: number; overlap?: OverlapType;
  morningHrs?: number; eveningHrs?: number;
};

const SLOT_ORDER = ["☀️ เช้า", "🌙 เย็น", "⚙️ กำหนดเอง", "❓ ไม่ระบุ"];
const FIXED_HOURS: Record<string, number> = { "☀️ เช้า": 7, "🌙 เย็น": 8 };
const FIXED_START: Record<string, number> = { "☀️ เช้า": 9, "🌙 เย็น": 16 };
const FIXED_END: Record<string, number> = { "☀️ เช้า": 16, "🌙 เย็น": 24 };

function getSlotName(start: string | null, end: string | null): string {
  if (start === "09:00" && end === "16:00") return "☀️ เช้า";
  if (start === "16:00" && (end === "00:00" || end === "24:00")) return "🌙 เย็น";
  if (start && end) return "⚙️ กำหนดเอง";
  return "❓ ไม่ระบุ";
}

// ── Page ───────────────────────────────────────────────────
export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const params = await searchParams;
  const days = Math.min(Math.max(parseInt(params.days || "30"), 7), 365);
  const today = new Date().toISOString().slice(0, 10);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days + 1);
  const start = startDate.toISOString().slice(0, 10);

  const entries = await prisma.timeEntry.findMany({
    where: { date: { gte: start, lte: today } },
    include: { user: true },
    orderBy: { date: "asc" },
  });

  const DAYS_OPTIONS = [7, 30, 60, 90];

  if (entries.length === 0) {
    return (
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-[#1A1A1A] pt-2">🔍 วิเคราะห์ยอดขาย</h1>
        <div className="flex gap-2">
          {DAYS_OPTIONS.map((d) => (
            <a key={d} href={`?days=${d}`}
              className={`text-sm px-4 py-2 rounded-xl font-medium border-2 transition-all ${
                days === d ? "border-[#F5D400] bg-[#FFF8CC] text-[#1A1A1A]" : "border-gray-200 text-gray-500 bg-white"
              }`}>{d} วัน</a>
          ))}
        </div>
        <p className="text-gray-400 text-center py-20">ยังไม่มีข้อมูลในช่วงนี้</p>
      </div>
    );
  }

  // ── Aggregate ─────────────────────────────────────────────
  const slotMap: Record<string, { count: number; total: number }> = {};
  const platMap: Record<string, { name: string; count: number; total: number }> = {};
  const empMap: Record<string, EmpStat> = {};
  const dailyMap: Record<string, number> = {};
  const customRangeMap: Record<string, { start: string; end: string; count: number; total: number }> = {};

  for (const e of entries) {
    const slot = getSlotName(e.customStart, e.customEnd);
    const platLabel = `${PLATFORM_EMOJI[e.platform] || "📱"} ${PLATFORM_LABELS[e.platform] || e.platform}`;

    if (!slotMap[slot]) slotMap[slot] = { count: 0, total: 0 };
    slotMap[slot].count++; slotMap[slot].total += e.salesAmount;

    if (slot === "⚙️ กำหนดเอง" && e.customStart && e.customEnd) {
      const rk = `${fmtTime(e.customStart)}–${fmtTime(e.customEnd)}`;
      if (!customRangeMap[rk]) customRangeMap[rk] = { start: e.customStart, end: e.customEnd, count: 0, total: 0 };
      customRangeMap[rk].count++; customRangeMap[rk].total += e.salesAmount;
    }

    if (!platMap[e.platform]) platMap[e.platform] = { name: platLabel, count: 0, total: 0 };
    platMap[e.platform].count++; platMap[e.platform].total += e.salesAmount;

    if (!empMap[e.userId]) empMap[e.userId] = { name: e.user.name, total: 0, count: 0, slots: {}, platforms: {} };
    empMap[e.userId].total += e.salesAmount; empMap[e.userId].count++;
    empMap[e.userId].slots[slot] = (empMap[e.userId].slots[slot] || 0) + e.salesAmount;
    empMap[e.userId].platforms[platLabel] = (empMap[e.userId].platforms[platLabel] || 0) + e.salesAmount;

    dailyMap[e.date] = (dailyMap[e.date] || 0) + e.salesAmount;
  }

  const customRanges: CustomRange[] = Object.entries(customRangeMap).map(([key, v]) => {
    const hrs = slotHours(v.start, v.end);
    const avg = Math.round(v.total / v.count);
    const { morning, evening } = calcOverlap(v.start, v.end);
    return {
      key, start: v.start, end: v.end,
      count: v.count, total: v.total, avg,
      hours: hrs, avgPerHour: Math.round(avg / hrs),
      overlap: getOverlapType(v.start, v.end),
      morningHrs: morning, eveningHrs: evening,
    };
  }).sort((a, b) => b.avgPerHour - a.avgPerHour);

  // Unified comparison
  const compItems: CompItem[] = [
    ...SLOT_ORDER
      .filter((s) => slotMap[s] && s !== "⚙️ กำหนดเอง" && s !== "❓ ไม่ระบุ")
      .map((s) => {
        const v = slotMap[s];
        const avg = Math.round(v.total / v.count);
        return {
          label: s, count: v.count, total: v.total, avg,
          avgPerHour: Math.round(avg / (FIXED_HOURS[s] ?? 7)),
          isFixed: true,
          startH: FIXED_START[s], endH: FIXED_END[s],
        };
      }),
    ...customRanges.map((r) => ({
      label: `⚙️ ${r.key}`, sublabel: `${r.hours % 1 === 0 ? r.hours : r.hours.toFixed(1)} ชม.`,
      count: r.count, total: r.total, avg: r.avg,
      avgPerHour: r.avgPerHour, isFixed: false,
      startH: toHours(r.start), endH: toHours(r.end),
      overlap: r.overlap, morningHrs: r.morningHrs, eveningHrs: r.eveningHrs,
    })),
  ].sort((a, b) => b.avgPerHour - a.avgPerHour);

  if (compItems.length > 0) compItems[0].isBest = true;

  const maxComp = Math.max(...compItems.map((c) => c.total), 1);
  const platList: PlatStat[] = Object.values(platMap)
    .map((p) => ({ ...p, avg: Math.round(p.total / p.count) }))
    .sort((a, b) => b.total - a.total);
  const empList: EmpStat[] = Object.values(empMap).sort((a, b) => b.total - a.total);
  const dailyTrend = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total]) => ({ date: date.slice(5), total }));

  const topEmp = empList[0];
  const bestComp = compItems[0];
  const bestPlat = platList[0];
  const matrixSlots = SLOT_ORDER.filter((s) => slotMap[s]);
  const maxPlat = Math.max(...platList.map((p) => p.total), 1);
  const maxEmp = Math.max(...empList.map((e) => e.total), 1);

  const exportEntries = entries.map((e) => ({
    date: e.date,
    userName: e.user.name,
    platform: e.platform,
    salesAmount: e.salesAmount,
    customStart: e.customStart,
    customEnd: e.customEnd,
  }));

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">🔍 วิเคราะห์ยอดขาย</h1>
        <ExportButton entries={exportEntries} days={days} dateRange={`${days} วันที่ผ่านมา`} />
      </div>

      {/* Period selector */}
      <div className="flex gap-2">
        {DAYS_OPTIONS.map((d) => (
          <a key={d} href={`?days=${d}`}
            className={`text-sm px-4 py-2 rounded-xl font-medium border-2 transition-all ${
              days === d ? "border-[#F5D400] bg-[#FFF8CC] text-[#1A1A1A]" : "border-gray-200 text-gray-500 bg-white"
            }`}>{d} วัน</a>
        ))}
      </div>

      {/* Quick summary */}
      <div className="rounded-2xl p-4 text-[#1A1A1A]"
        style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}>
        <h2 className="font-bold mb-3">💡 สรุปอย่างรวดเร็ว — {days} วันที่ผ่านมา</h2>
        <div className="grid grid-cols-3 gap-2">
          {bestComp && (
            <div className="bg-white/50 rounded-xl p-2.5 text-center">
              <div className="text-[10px] text-[#1A1A1A]/60 mb-1">เวลาขายดีสุด</div>
              <div className="font-bold text-sm leading-tight">{bestComp.label}</div>
              <div className="text-[10px] mt-0.5">฿{bestComp.avgPerHour.toLocaleString("th-TH")}/ชม.</div>
            </div>
          )}
          {bestPlat && (
            <div className="bg-white/50 rounded-xl p-2.5 text-center">
              <div className="text-[10px] text-[#1A1A1A]/60 mb-1">Platform ดีสุด</div>
              <div className="font-bold text-sm leading-tight">{bestPlat.name}</div>
              <div className="text-[10px] mt-0.5">{formatCurrency(bestPlat.total)}</div>
            </div>
          )}
          {topEmp && (
            <div className="bg-white/50 rounded-xl p-2.5 text-center">
              <div className="text-[10px] text-[#1A1A1A]/60 mb-1">Top performer</div>
              <div className="font-bold text-sm leading-tight truncate">{topEmp.name}</div>
              <div className="text-[10px] mt-0.5">{formatCurrency(topEmp.total)}</div>
            </div>
          )}
        </div>
      </div>

      {/* ⏰ Time slot ranking */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="font-bold text-[#1A1A1A] mb-1">⏰ ช่วงเวลาที่ขายดีที่สุด</h2>
        <p className="text-xs text-gray-400 mb-4">เรียงจากดีสุดไปแย่สุด วัดจากยอดเฉลี่ยต่อชั่วโมง</p>

        <div className="space-y-3">
          {compItems.map((c, i) => {
            const rank = i + 1;
            const rankEmoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `${rank}.`;
            const pct = Math.round((c.avgPerHour / (compItems[0]?.avgPerHour || 1)) * 100);

            // คำอธิบาย overlap แบบสั้น
            let overlapNote = "";
            if (c.overlap === "⚠️ คาบเกี่ยว") overlapNote = "คาบเช้า+เย็น";
            else if (c.overlap === "☀️ เช้า") overlapNote = "อยู่ในช่วงเช้า";
            else if (c.overlap === "🌙 เย็น") overlapNote = "อยู่ในช่วงเย็น";

            return (
              <div key={c.label}
                className={`rounded-xl p-3 border-2 transition-all ${
                  c.isBest ? "border-[#F5D400] bg-[#FFF8CC]" : "border-gray-100 bg-gray-50"
                }`}>
                <div className="flex items-center justify-between gap-3">
                  {/* Left: rank + name */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl flex-shrink-0">{rankEmoji}</span>
                    <div className="min-w-0">
                      <div className="font-bold text-[#1A1A1A] text-sm leading-tight">
                        {c.label}
                        {c.overlap === "⚠️ คาบเกี่ยว" && (
                          <span className="ml-1.5 text-[10px] text-orange-400 font-normal">คาบเช้า+เย็น</span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {c.count} ครั้ง
                        {c.sublabel && ` · ${c.sublabel}`}
                        {overlapNote && !c.isBest && c.overlap !== "⚠️ คาบเกี่ยว" && ` · ${overlapNote}`}
                      </div>
                    </div>
                  </div>

                  {/* Right: key metric */}
                  <div className="text-right flex-shrink-0">
                    <div className={`text-lg font-bold ${c.isBest ? "text-[#1A1A1A]" : "text-gray-700"}`}>
                      {formatCurrency(c.avgPerHour)}
                    </div>
                    <div className="text-[10px] text-gray-400">ต่อชั่วโมง</div>
                  </div>
                </div>

                {/* Progress bar เทียบกับอันดับ 1 */}
                <div className="mt-2.5 h-1.5 bg-white rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      background: c.isBest
                        ? "linear-gradient(90deg,#F5D400,#F5A882)"
                        : "linear-gradient(90deg,#d1d5db,#9ca3af)",
                    }} />
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-gray-300 mt-3 text-center">
          ยอด/ชม. ใช้เปรียบเทียบข้ามช่วงเวลาที่ยาวไม่เท่ากัน
        </p>
      </div>

      {/* 📱 Platform */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="font-bold text-[#1A1A1A] mb-0.5">📱 Platform ที่ขายดีที่สุด</h2>
        <p className="text-xs text-gray-400 mb-3">เรียงตามยอดขายรวม</p>
        <div className="space-y-3">
          {platList.map((p, i) => (
            <div key={p.name}>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-1.5">
                  {i === 0 && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-lg font-bold">Best</span>}
                  <span className="font-semibold text-[#1A1A1A] text-sm">{p.name}</span>
                  <span className="text-xs text-gray-400">{p.count} ครั้ง</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[#1A1A1A] text-sm">{formatCurrency(p.total)}</div>
                  <div className="text-[10px] text-gray-400">avg {formatCurrency(p.avg)}/ครั้ง</div>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(p.total / maxPlat) * 100}%`, background: "linear-gradient(90deg,#6366f1,#a855f7)" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🏆 Top performer */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="font-bold text-[#1A1A1A] mb-3">🏆 Top Performer</h2>
        <div className="space-y-3">
          {empList.map((emp, i) => (
            <div key={emp.name}>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{["🥇","🥈","🥉"][i] || "👤"}</span>
                  <div>
                    <div className="font-semibold text-[#1A1A1A] text-sm">{emp.name}</div>
                    <div className="text-[10px] text-gray-400">
                      {emp.count} รายการ · avg {formatCurrency(Math.round(emp.total / emp.count))}/ครั้ง
                    </div>
                  </div>
                </div>
                <span className="font-bold text-[#1A1A1A]">{formatCurrency(emp.total)}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(emp.total / maxEmp) * 100}%`, background: "linear-gradient(90deg,#F5D400,#F5A882)" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 👤 × ⏰ Matrix */}
      {matrixSlots.length > 0 && empList.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-bold text-[#1A1A1A] mb-0.5">👤 × ⏰ พนักงาน vs ช่วงเวลา</h2>
          <p className="text-xs text-gray-400 mb-3">ดูว่าใครขายดีช่วงไหน</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left pb-2 text-gray-400 font-medium pr-3 whitespace-nowrap">พนักงาน</th>
                  {matrixSlots.map((s) => (
                    <th key={s} className="pb-2 text-gray-400 font-medium text-center min-w-[72px] whitespace-nowrap">{s}</th>
                  ))}
                  <th className="pb-2 text-gray-400 font-medium text-right pl-2 whitespace-nowrap">รวม</th>
                </tr>
              </thead>
              <tbody>
                {empList.map((emp) => (
                  <tr key={emp.name} className="border-t border-gray-50">
                    <td className="py-2 font-medium text-[#1A1A1A] pr-3 whitespace-nowrap">{emp.name}</td>
                    {matrixSlots.map((s) => {
                      const val = emp.slots[s] || 0;
                      return (
                        <td key={s} className="py-2 text-center">
                          {val > 0 ? <span className="font-semibold text-[#1A1A1A]">{formatCurrency(val)}</span> : <span className="text-gray-200">—</span>}
                        </td>
                      );
                    })}
                    <td className="py-2 text-right pl-2 font-bold text-[#1A1A1A]">{formatCurrency(emp.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 👤 × 📱 Matrix */}
      {platList.length > 0 && empList.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-bold text-[#1A1A1A] mb-0.5">👤 × 📱 พนักงาน vs Platform</h2>
          <p className="text-xs text-gray-400 mb-3">ดูว่าใครถนัด Platform ไหน</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left pb-2 text-gray-400 font-medium pr-3 whitespace-nowrap">พนักงาน</th>
                  {platList.map((p) => (
                    <th key={p.name} className="pb-2 text-gray-400 font-medium text-center min-w-[72px] whitespace-nowrap">{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {empList.map((emp) => (
                  <tr key={emp.name} className="border-t border-gray-50">
                    <td className="py-2 font-medium text-[#1A1A1A] pr-3 whitespace-nowrap">{emp.name}</td>
                    {platList.map((p) => {
                      const val = emp.platforms[p.name] || 0;
                      return (
                        <td key={p.name} className="py-2 text-center">
                          {val > 0 ? <span className="font-semibold text-[#1A1A1A]">{formatCurrency(val)}</span> : <span className="text-gray-200">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 📈 Daily trend */}
      {dailyTrend.length > 1 && <InsightsTrendChart data={dailyTrend} />}
    </div>
  );
}
