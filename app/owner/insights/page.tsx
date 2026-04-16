export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatCurrency, PLATFORM_LABELS } from "@/lib/utils";
import InsightsTrendChart from "./InsightsTrendChart";

const PLATFORM_EMOJI: Record<string, string> = {
  TIKTOK: "🎵", SHOPEE: "🛒", FACEBOOK: "📘", OTHER: "📱",
};

function getSlotName(start: string | null, end: string | null): string {
  if (start === "09:00" && end === "16:00") return "☀️ เช้า";
  if (start === "16:00" && (end === "00:00" || end === "24:00")) return "🌙 เย็น";
  if (start && end) return "⚙️ กำหนดเอง";
  return "❓ ไม่ระบุ";
}

const SLOT_ORDER = ["☀️ เช้า", "🌙 เย็น", "⚙️ กำหนดเอง", "❓ ไม่ระบุ"];

type SlotStat = { count: number; total: number; avg: number };
type PlatStat = { name: string; count: number; total: number; avg: number };
type EmpStat = {
  name: string;
  total: number;
  count: number;
  slots: Record<string, number>;
  platforms: Record<string, number>;
};

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
              }`}>
              {d} วัน
            </a>
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

  for (const e of entries) {
    const slot = getSlotName(e.customStart, e.customEnd);
    const platKey = e.platform;
    const platLabel = `${PLATFORM_EMOJI[e.platform] || "📱"} ${PLATFORM_LABELS[e.platform] || e.platform}`;

    // slot
    if (!slotMap[slot]) slotMap[slot] = { count: 0, total: 0 };
    slotMap[slot].count++;
    slotMap[slot].total += e.salesAmount;

    // platform
    if (!platMap[platKey]) platMap[platKey] = { name: platLabel, count: 0, total: 0 };
    platMap[platKey].count++;
    platMap[platKey].total += e.salesAmount;

    // employee
    if (!empMap[e.userId])
      empMap[e.userId] = { name: e.user.name, total: 0, count: 0, slots: {}, platforms: {} };
    empMap[e.userId].total += e.salesAmount;
    empMap[e.userId].count++;
    empMap[e.userId].slots[slot] = (empMap[e.userId].slots[slot] || 0) + e.salesAmount;
    empMap[e.userId].platforms[platLabel] =
      (empMap[e.userId].platforms[platLabel] || 0) + e.salesAmount;

    // daily
    dailyMap[e.date] = (dailyMap[e.date] || 0) + e.salesAmount;
  }

  const slotList: (SlotStat & { slot: string })[] = SLOT_ORDER.filter((s) => slotMap[s]).map(
    (s) => ({ slot: s, ...slotMap[s], avg: Math.round(slotMap[s].total / slotMap[s].count) })
  );

  const platList: PlatStat[] = Object.values(platMap)
    .map((p) => ({ ...p, avg: Math.round(p.total / p.count) }))
    .sort((a, b) => b.total - a.total);

  const empList: EmpStat[] = Object.values(empMap).sort((a, b) => b.total - a.total);

  const dailyTrend = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total]) => ({ date: date.slice(5), total }));

  // Sort slots by avg for insights
  const slotByAvg = [...slotList].sort((a, b) => b.avg - a.avg);
  const bestSlot = slotByAvg[0];
  const bestPlat = platList[0];
  const topEmp = empList[0];

  const maxSlot = Math.max(...slotList.map((s) => s.total), 1);
  const maxPlat = Math.max(...platList.map((p) => p.total), 1);
  const maxEmp = Math.max(...empList.map((e) => e.total), 1);

  // Unique slot keys for matrix
  const matrixSlots = SLOT_ORDER.filter((s) => slotMap[s]);

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-28">
      <h1 className="text-2xl font-bold text-[#1A1A1A] pt-2">🔍 วิเคราะห์ยอดขาย</h1>

      {/* Period selector */}
      <div className="flex gap-2">
        {DAYS_OPTIONS.map((d) => (
          <a key={d} href={`?days=${d}`}
            className={`text-sm px-4 py-2 rounded-xl font-medium border-2 transition-all ${
              days === d
                ? "border-[#F5D400] bg-[#FFF8CC] text-[#1A1A1A]"
                : "border-gray-200 text-gray-500 bg-white"
            }`}>
            {d} วัน
          </a>
        ))}
      </div>

      {/* Quick summary card */}
      <div
        className="rounded-2xl p-4 text-[#1A1A1A]"
        style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}
      >
        <h2 className="font-bold mb-3">💡 สรุปอย่างรวดเร็ว — {days} วันที่ผ่านมา</h2>
        <div className="grid grid-cols-3 gap-2">
          {bestSlot && (
            <div className="bg-white/50 rounded-xl p-2.5 text-center">
              <div className="text-[10px] text-[#1A1A1A]/60 mb-1">เวลาขายดีสุด (avg)</div>
              <div className="font-bold text-sm leading-tight">{bestSlot.slot}</div>
              <div className="text-[10px] mt-0.5">฿{bestSlot.avg.toLocaleString("th-TH")}/ครั้ง</div>
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

      {/* ⏰ Time slot analysis */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="font-bold text-[#1A1A1A] mb-0.5">⏰ ช่วงเวลาที่ขายดีที่สุด</h2>
        <p className="text-xs text-gray-400 mb-3">เรียงตามยอด avg ต่อครั้ง (บอกว่าไลฟ์ช่วงไหนได้เงินดีกว่า)</p>
        <div className="space-y-3">
          {slotByAvg.map((s, i) => (
            <div key={s.slot}>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-1.5">
                  {i === 0 && (
                    <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-lg font-bold">
                      Best
                    </span>
                  )}
                  <span className="font-semibold text-[#1A1A1A] text-sm">{s.slot}</span>
                  <span className="text-xs text-gray-400">{s.count} ครั้ง</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[#1A1A1A] text-sm">{formatCurrency(s.total)}</div>
                  <div className="text-[10px] text-gray-400">avg {formatCurrency(s.avg)}/ครั้ง</div>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(s.total / maxSlot) * 100}%`,
                    background: "linear-gradient(90deg, #F5D400, #F5A882)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 📱 Platform analysis */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="font-bold text-[#1A1A1A] mb-0.5">📱 Platform ที่ขายดีที่สุด</h2>
        <p className="text-xs text-gray-400 mb-3">เรียงตามยอดขายรวม</p>
        <div className="space-y-3">
          {platList.map((p, i) => (
            <div key={p.name}>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-1.5">
                  {i === 0 && (
                    <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-lg font-bold">
                      Best
                    </span>
                  )}
                  <span className="font-semibold text-[#1A1A1A] text-sm">{p.name}</span>
                  <span className="text-xs text-gray-400">{p.count} ครั้ง</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[#1A1A1A] text-sm">{formatCurrency(p.total)}</div>
                  <div className="text-[10px] text-gray-400">avg {formatCurrency(p.avg)}/ครั้ง</div>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(p.total / maxPlat) * 100}%`,
                    background: "linear-gradient(90deg, #6366f1, #a855f7)",
                  }}
                />
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
                  <span className="text-xl">{["🥇", "🥈", "🥉"][i] || "👤"}</span>
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
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(emp.total / maxEmp) * 100}%`,
                    background: "linear-gradient(90deg, #F5D400, #F5A882)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 👤 × ⏰ Employee × Time slot matrix */}
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
                    <th key={s} className="pb-2 text-gray-400 font-medium text-center min-w-[72px] whitespace-nowrap">
                      {s}
                    </th>
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
                          {val > 0 ? (
                            <span className="font-semibold text-[#1A1A1A]">{formatCurrency(val)}</span>
                          ) : (
                            <span className="text-gray-200">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-2 text-right pl-2 font-bold text-[#1A1A1A]">
                      {formatCurrency(emp.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 👤 × 📱 Employee × Platform matrix */}
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
                    <th key={p.name} className="pb-2 text-gray-400 font-medium text-center min-w-[72px] whitespace-nowrap">
                      {p.name}
                    </th>
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
                          {val > 0 ? (
                            <span className="font-semibold text-[#1A1A1A]">{formatCurrency(val)}</span>
                          ) : (
                            <span className="text-gray-200">—</span>
                          )}
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

      {/* 📈 Daily trend chart */}
      {dailyTrend.length > 1 && <InsightsTrendChart data={dailyTrend} />}
    </div>
  );
}
