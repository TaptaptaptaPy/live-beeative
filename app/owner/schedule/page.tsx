export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { PLATFORM_LABELS } from "@/lib/utils";
import ScheduleForm from "./ScheduleForm";
import DeleteScheduleButton from "./DeleteScheduleButton";

function getWeekDates(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const mon = new Date(d);
  mon.setDate(d.getDate() - ((day + 6) % 7));
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const curr = new Date(mon);
    curr.setDate(mon.getDate() + i);
    dates.push(curr.toISOString().slice(0, 10));
  }
  return dates;
}

const DAY_LABELS = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];
const DAY_FULL = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"];
const PLATFORM_EMOJI: Record<string, string> = {
  TIKTOK: "🎵", SHOPEE: "🛒", FACEBOOK: "📘", OTHER: "📱",
};

type EntryGroup = {
  userId: string;
  userName: string;
  profileImage: string | null;
  platform: string;
  salesAmount: number;
  count: number;
  brandId: string | null;
  brandName: string | null;
  brandColor: string | null;
  timeLabel: string | null;
};

// Raw snapshot per user per day — for mismatch detection
type UserDaySummary = {
  platforms: Set<string>;
  brandIds: Set<string | null>;
  timePairs: Array<{ start: string; end: string }>; // actual recorded times
  totalSales: number;
  totalCount: number;
};

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; userId?: string }>;
}) {
  const params = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const weekStart = params.week || getWeekDates(today)[0];
  const filterUserId = params.userId || "";

  const weekDates = getWeekDates(weekStart);
  const weekEnd = weekDates[6];

  const [employees, schedules, brands, entries] = await Promise.all([
    prisma.user.findMany({ where: { role: "EMPLOYEE", isActive: true }, orderBy: { name: "asc" } }),
    prisma.workSchedule.findMany({
      where: {
        date: { gte: weekDates[0], lte: weekEnd },
        ...(filterUserId ? { userId: filterUserId } : {}),
      },
      include: { user: true, brand: true },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    prisma.brand.findMany({ where: { isActive: true }, select: { id: true, name: true, color: true } }),
    prisma.timeEntry.findMany({
      where: {
        date: { gte: weekDates[0], lte: weekEnd },
        ...(filterUserId ? { userId: filterUserId } : {}),
      },
      include: {
        user: { select: { id: true, name: true, profileImage: true } },
        brand: { select: { id: true, name: true, color: true } },
        session: { select: { name: true, startTime: true, endTime: true } },
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  // Group schedules by date
  const scheduledByDate: Record<string, typeof schedules> = {};
  for (const d of weekDates) scheduledByDate[d] = [];
  for (const s of schedules) scheduledByDate[s.date]?.push(s);

  // EntryGroups by date (for display)
  const entriesByDate: Record<string, EntryGroup[]> = {};
  for (const d of weekDates) entriesByDate[d] = [];

  const acc: Record<string, EntryGroup> = {};
  for (const e of entries) {
    const key = `${e.date}__${e.userId}__${e.platform}`;
    if (!acc[key]) {
      let timeLabel: string | null = null;
      if (e.session) timeLabel = e.session.name;
      else if (e.customStart && e.customEnd) timeLabel = `${e.customStart}–${e.customEnd}`;
      acc[key] = {
        userId: e.userId,
        userName: e.user.name,
        profileImage: e.user.profileImage,
        platform: e.platform,
        salesAmount: 0,
        count: 0,
        brandId: e.brandId,
        brandName: e.brand?.name ?? null,
        brandColor: e.brand?.color ?? null,
        timeLabel,
      };
    }
    acc[key].salesAmount += e.salesAmount;
    acc[key].count += 1;
  }
  for (const [key, group] of Object.entries(acc)) {
    const date = key.split("__")[0];
    entriesByDate[date]?.push(group);
  }

  // Raw summary per date+userId — for mismatch detection
  const userDaySummary: Record<string, UserDaySummary> = {};
  for (const e of entries) {
    const key = `${e.date}__${e.userId}`;
    if (!userDaySummary[key]) {
      userDaySummary[key] = { platforms: new Set(), brandIds: new Set(), timePairs: [], totalSales: 0, totalCount: 0 };
    }
    userDaySummary[key].platforms.add(e.platform);
    userDaySummary[key].brandIds.add(e.brandId);
    // เก็บเวลาจริงที่บันทึก (session หรือ customStart/End)
    const eStart = e.customStart ?? (e.session as { startTime?: string } | null)?.startTime ?? null;
    const eEnd   = e.customEnd   ?? (e.session as { endTime?: string }   | null)?.endTime   ?? null;
    if (eStart && eEnd) {
      const alreadyAdded = userDaySummary[key].timePairs.some(t => t.start === eStart && t.end === eEnd);
      if (!alreadyAdded) userDaySummary[key].timePairs.push({ start: eStart, end: eEnd });
    }
    userDaySummary[key].totalSales += e.salesAmount;
    userDaySummary[key].totalCount += 1;
  }

  // Planned users per date
  const plannedUsersByDate: Record<string, Set<string>> = {};
  for (const d of weekDates) plannedUsersByDate[d] = new Set();
  for (const s of schedules) plannedUsersByDate[s.date]?.add(s.userId);

  // Week summary
  const totalScheduled = schedules.length;
  const totalSalesThisWeek = entries.reduce((s, e) => s + e.salesAmount, 0);
  const daysWithEntries = new Set(entries.map((e) => e.date)).size;

  function prevWeek() {
    const d = new Date(weekStart); d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  }
  function nextWeek() {
    const d = new Date(weekStart); d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  }
  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams({ week: weekStart, userId: filterUserId, ...overrides });
    return `/owner/schedule?${p.toString()}`;
  }
  function fmt(n: number) {
    return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(n);
  }

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[#1A1A1A] pt-2">📅 ตารางไลฟ์</h1>

      {/* Week navigator */}
      <div className="bg-white rounded-2xl p-3 shadow-sm flex items-center justify-between">
        <a href={buildUrl({ week: prevWeek() })}
          className="w-10 h-10 flex items-center justify-center rounded-xl border-2 border-gray-200 text-gray-600 hover:border-[#F5D400] text-lg">‹</a>
        <div className="text-center">
          <div className="font-semibold text-[#1A1A1A]">{weekDates[0].slice(5)} – {weekDates[6].slice(5)}</div>
          <div className="text-xs text-gray-400">{weekStart.slice(0, 7)}</div>
        </div>
        <a href={buildUrl({ week: nextWeek() })}
          className="w-10 h-10 flex items-center justify-center rounded-xl border-2 border-gray-200 text-gray-600 hover:border-[#F5D400] text-lg">›</a>
      </div>

      {/* Day pills */}
      <div className="grid grid-cols-7 gap-1">
        {weekDates.map((date, i) => {
          const isToday = date === today;
          const hasActivity = scheduledByDate[date]?.length > 0 || entriesByDate[date]?.length > 0;
          return (
            <div key={date}
              className={`flex flex-col items-center p-1.5 rounded-xl text-xs ${isToday ? "bg-[#F5D400] font-bold" : "bg-white shadow-sm"}`}>
              <span className="text-gray-500">{DAY_LABELS[i]}</span>
              <span className={`font-semibold ${isToday ? "text-[#1A1A1A]" : "text-gray-700"}`}>{date.slice(8)}</span>
              {hasActivity && <div className="w-1.5 h-1.5 rounded-full bg-[#F5A882] mt-0.5" />}
            </div>
          );
        })}
      </div>

      {/* Week summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
          <div className="text-xs text-gray-400 mb-0.5">วางแผน</div>
          <div className="font-bold text-[#1A1A1A]">{totalScheduled} ช่วง</div>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
          <div className="text-xs text-gray-400 mb-0.5">บันทึกจริง</div>
          <div className="font-bold text-green-600">{daysWithEntries} วัน</div>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
          <div className="text-xs text-gray-400 mb-0.5">ยอดสัปดาห์</div>
          <div className="font-bold text-indigo-600 text-sm">{fmt(totalSalesThisWeek)}</div>
        </div>
      </div>

      {/* Filter by employee */}
      <div className="flex gap-2 flex-wrap">
        <a href={buildUrl({ userId: "" })}
          className={`text-xs px-3 py-1.5 rounded-full border-2 font-medium transition-all ${!filterUserId ? "border-[#F5D400] bg-[#FFF8CC]" : "border-gray-200 text-gray-500"}`}>
          ทั้งหมด
        </a>
        {employees.map((e) => (
          <a key={e.id} href={buildUrl({ userId: e.id })}
            className={`text-xs px-3 py-1.5 rounded-full border-2 font-medium transition-all ${filterUserId === e.id ? "border-[#F5D400] bg-[#FFF8CC]" : "border-gray-200 text-gray-500"}`}>
            {e.name}
          </a>
        ))}
      </div>

      {/* Schedule by day */}
      <div className="space-y-3">
        {weekDates.map((date, i) => {
          const slots = scheduledByDate[date] ?? [];
          const actualEntries = entriesByDate[date] ?? [];
          const isPast = date < today;
          const hasAnything = slots.length > 0 || actualEntries.length > 0;

          const actualByUser: Record<string, EntryGroup[]> = {};
          for (const eg of actualEntries) {
            if (!actualByUser[eg.userId]) actualByUser[eg.userId] = [];
            actualByUser[eg.userId].push(eg);
          }

          const unplannedEntries = actualEntries.filter(
            (eg) => !plannedUsersByDate[date]?.has(eg.userId)
          );

          // Count mismatches for day header
          let dayMismatches = 0;
          for (const s of slots) {
            const summary = userDaySummary[`${date}__${s.userId}`];
            const otherEntries = actualEntries.filter(eg => eg.userId !== s.userId);
            // พนักงานไม่ตรง: คนที่วางแผนไม่ได้บันทึก แต่มีคนอื่นบันทึกแทน
            if (!summary && (isPast || date === today) && otherEntries.length > 0) { dayMismatches++; continue; }
            if (!summary) continue;
            if (s.platform && !summary.platforms.has(s.platform)) dayMismatches++;
            if (s.brandId && !summary.brandIds.has(s.brandId)) dayMismatches++;
            if (summary.timePairs.length > 0 &&
                !summary.timePairs.some(t => t.start === s.startTime && t.end === s.endTime))
              dayMismatches++;
          }

          return (
            <div key={date} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Day header */}
              <div className={`px-4 py-2.5 flex items-center justify-between ${date === today ? "bg-[#FFF8CC]" : ""}`}>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#1A1A1A]">{DAY_FULL[i]}</span>
                  <span className="text-gray-400 text-sm">{date}</span>
                  {date === today && <span className="text-xs text-[#F5A882] font-semibold">วันนี้</span>}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {slots.length > 0 && <span className="text-gray-400">📋 {slots.length} แผน</span>}
                  {actualEntries.length > 0 && <span className="text-gray-400">✅ {actualEntries.length} จริง</span>}
                  {dayMismatches > 0 && (
                    <span className="bg-orange-100 text-orange-600 font-semibold px-2 py-0.5 rounded-full">
                      ⚠️ {dayMismatches} ไม่ตรง
                    </span>
                  )}
                </div>
              </div>

              {!hasAnything ? (
                <div className="px-4 py-3 text-xs text-gray-400">ยังไม่มีข้อมูล</div>
              ) : (
                <div className="divide-y divide-gray-50">

                  {/* ── แผนล่วงหน้า + เปรียบกับจริง ── */}
                  {slots.map((s) => {
                    const summary = userDaySummary[`${date}__${s.userId}`];
                    const userActuals = actualByUser[s.userId] ?? [];
                    const hasActual = !!summary;

                    // Mismatch detection
                    const platformMismatch = s.platform && hasActual && !summary.platforms.has(s.platform);
                    const brandMismatch = s.brandId && hasActual && !summary.brandIds.has(s.brandId);
                    const timeMismatch = hasActual &&
                      summary.timePairs.length > 0 &&
                      !summary.timePairs.some(t => t.start === s.startTime && t.end === s.endTime);
                    // พนักงานไม่ตรง: คนที่วางแผนไม่ได้บันทึกเลย แต่มีคนอื่นบันทึกแทน
                    const otherActualUsers = actualEntries.filter(eg => eg.userId !== s.userId);
                    const uniqueSubstitutes = [...new Map(otherActualUsers.map(eg => [eg.userId, eg.userName])).values()];
                    const employeeMismatch = (isPast || date === today) && !hasActual && uniqueSubstitutes.length > 0;
                    const hasMismatch = platformMismatch || brandMismatch || timeMismatch || employeeMismatch;

                    // What actually happened
                    const actualPlatforms = summary ? [...summary.platforms] : [];
                    const actualBrandNames = userActuals
                      .filter((g) => g.brandName)
                      .map((g) => ({ name: g.brandName!, color: g.brandColor }))
                      .filter((v, i, arr) => arr.findIndex((x) => x.name === v.name) === i);

                    return (
                      <div key={s.id}
                        className={`px-4 py-3 ${hasMismatch ? "bg-orange-50 border-l-4 border-orange-300" : "bg-[#FFFBEB]"}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <div className="relative flex-shrink-0">
                              <Avatar user={s.user as { name: string; profileImage?: string | null }} />
                              {employeeMismatch && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold">!</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm flex items-center gap-1.5 text-[#1A1A1A]">
                                {employeeMismatch ? (
                                  <>
                                    <span className="text-gray-400 line-through">{s.user.name}</span>
                                    <span className="text-orange-500 font-semibold">→ {uniqueSubstitutes.join(", ")} (ไลฟ์แทน)</span>
                                  </>
                                ) : s.user.name}
                              </div>

                              {/* แผน */}
                              <div className="text-xs text-gray-500 flex items-center gap-1.5 flex-wrap mt-0.5">
                                <span className="text-[#F5A882] font-semibold">📋 แผน:</span>
                                <span className={timeMismatch ? "line-through text-gray-300" : ""}>
                                  ⏰ {s.startTime}–{s.endTime}
                                </span>
                                {s.platform && (
                                  <span className={platformMismatch ? "line-through text-gray-300" : ""}>
                                    {PLATFORM_EMOJI[s.platform]} {PLATFORM_LABELS[s.platform]}
                                  </span>
                                )}
                                {s.brand && (
                                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${brandMismatch ? "opacity-40 line-through" : ""}`}
                                    style={{ background: (s.brand.color ?? "#ccc") + "22", color: s.brand.color ?? "#555" }}>
                                    {s.brand.name}
                                  </span>
                                )}
                                {s.note && <span className="text-gray-400">· {s.note}</span>}
                              </div>

                              {/* จริง (แสดงเสมอถ้าผ่านวันนั้นแล้ว) */}
                              {(isPast || date === today) && hasActual && (
                                <div className="text-xs flex items-center gap-1.5 flex-wrap mt-1">
                                  <span className={`font-semibold ${hasMismatch ? "text-orange-500" : "text-green-600"}`}>
                                    {hasMismatch ? "⚠️ จริง:" : "✅ จริง:"}
                                  </span>
                                  {summary!.timePairs.map((t, ti) => (
                                    <span key={ti} className={`flex items-center gap-0.5 ${timeMismatch ? "text-orange-600 font-semibold" : "text-gray-600"}`}>
                                      ⏰ {t.start}–{t.end}
                                    </span>
                                  ))}
                                  {actualPlatforms.map((p) => (
                                    <span key={p} className={`flex items-center gap-0.5 ${platformMismatch && s.platform !== p ? "text-orange-600 font-semibold" : "text-gray-600"}`}>
                                      {PLATFORM_EMOJI[p]} {PLATFORM_LABELS[p]}
                                    </span>
                                  ))}
                                  {actualBrandNames.map((b) => (
                                    <span key={b.name}
                                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${brandMismatch && s.brand?.name !== b.name ? "ring-1 ring-orange-400" : ""}`}
                                      style={{ background: (b.color ?? "#ccc") + "22", color: b.color ?? "#555" }}>
                                      {b.name}
                                    </span>
                                  ))}
                                  {actualBrandNames.length === 0 && summary.brandIds.has(null) && (
                                    <span className="text-gray-400 text-[10px]">ไม่ระบุแบรนด์</span>
                                  )}
                                </div>
                              )}

                              {/* Mismatch explanation */}
                              {hasMismatch && (
                                <div className="mt-1.5 text-[10px] text-orange-600 bg-orange-100 rounded-lg px-2 py-1 space-y-0.5">
                                  {employeeMismatch && (
                                    <div>👤 เปลี่ยนคนไลฟ์: {s.user.name} → {uniqueSubstitutes.join(", ")} มาไลฟ์แทน</div>
                                  )}
                                  {timeMismatch && (
                                    <div>⏰ เวลาไม่ตรง: วางแผน {s.startTime}–{s.endTime} แต่บันทึกจริง {summary!.timePairs.map(t => `${t.start}–${t.end}`).join(", ")}</div>
                                  )}
                                  {platformMismatch && (
                                    <div>📱 Platform ไม่ตรง: วางแผน {PLATFORM_LABELS[s.platform!]} แต่ไลฟ์จริง {actualPlatforms.map(p => PLATFORM_LABELS[p]).join(", ")}</div>
                                  )}
                                  {brandMismatch && (
                                    <div>🏷️ แบรนด์ไม่ตรง: วางแผน {s.brand?.name} แต่ขายจริง {actualBrandNames.map(b => b.name).join(", ") || "ไม่ระบุแบรนด์"}</div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* ยอดขายจริง */}
                          <div className="flex items-start gap-2 flex-shrink-0">
                            {(isPast || date === today) && (
                              hasActual ? (
                                <div className="text-right">
                                  <div className={`text-sm font-bold ${hasMismatch ? "text-orange-500" : "text-green-600"}`}>
                                    {fmt(summary.totalSales)}
                                  </div>
                                  <div className="text-[10px] text-gray-400">{summary.totalCount} รายการ</div>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-300 italic">ยังไม่บันทึก</span>
                              )
                            )}
                            <DeleteScheduleButton id={s.id} />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* ── บันทึกจริง (ไม่มีแผน) ── */}
                  {unplannedEntries.map((eg, idx) => (
                    <div key={`unplanned-${idx}`} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <Avatar user={{ name: eg.userName, profileImage: eg.profileImage }} />
                          <div>
                            <div className="font-medium text-[#1A1A1A] text-sm">{eg.userName}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1.5 flex-wrap mt-0.5">
                              <span className="text-green-600 font-medium">✅ บันทึก (ไม่มีแผน)</span>
                              {eg.timeLabel && <span>⏰ {eg.timeLabel}</span>}
                              <span>{PLATFORM_EMOJI[eg.platform]} {PLATFORM_LABELS[eg.platform]}</span>
                              {eg.brandName && (
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                                  style={{ background: (eg.brandColor ?? "#ccc") + "22", color: eg.brandColor ?? "#555" }}>
                                  {eg.brandName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-semibold text-green-600">{fmt(eg.salesAmount)}</div>
                          <div className="text-[10px] text-gray-400">{eg.count} รายการ</div>
                        </div>
                      </div>
                    </div>
                  ))}

                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add schedule form */}
      <ScheduleForm
        employees={employees.map((e) => ({ id: e.id, name: e.name }))}
        brands={brands}
        defaultDate={today}
      />
    </div>
  );
}

function Avatar({ user }: { user: { name: string; profileImage?: string | null } }) {
  return (
    <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#F5D400] flex-shrink-0">
      {user.profileImage ? (
        <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-[#FFF8CC] flex items-center justify-center text-sm font-bold text-[#1A1A1A]">
          {user.name.slice(0, 1)}
        </div>
      )}
    </div>
  );
}
