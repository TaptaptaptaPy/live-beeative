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
  brandName: string | null;
  brandColor: string | null;
  timeLabel: string | null;
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
    prisma.user.findMany({
      where: { role: "EMPLOYEE", isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.workSchedule.findMany({
      where: {
        date: { gte: weekDates[0], lte: weekEnd },
        ...(filterUserId ? { userId: filterUserId } : {}),
      },
      include: { user: true, brand: true },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    prisma.brand.findMany({
      where: { isActive: true },
      select: { id: true, name: true, color: true },
    }),
    // fetch full entry data with user + brand
    prisma.timeEntry.findMany({
      where: {
        date: { gte: weekDates[0], lte: weekEnd },
        ...(filterUserId ? { userId: filterUserId } : {}),
      },
      include: {
        user: { select: { id: true, name: true, profileImage: true } },
        brand: { select: { name: true, color: true } },
        session: { select: { name: true } },
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  // Group schedules by date
  const scheduledByDate: Record<string, typeof schedules> = {};
  for (const d of weekDates) scheduledByDate[d] = [];
  for (const s of schedules) scheduledByDate[s.date]?.push(s);

  // Group entries by date → userId → aggregated
  // Each unique (date, userId, platform) = one row
  const entriesByDate: Record<string, EntryGroup[]> = {};
  for (const d of weekDates) entriesByDate[d] = [];

  // Temp accumulator: date__userId__platform → group
  const acc: Record<string, EntryGroup> = {};
  for (const e of entries) {
    const key = `${e.date}__${e.userId}__${e.platform}`;
    if (!acc[key]) {
      // build time label from session or custom times
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
    if (entriesByDate[date]) entriesByDate[date].push(group);
  }

  // Set of userIds who have planned slots per date (to detect "unplanned" entries)
  const plannedUsersByDate: Record<string, Set<string>> = {};
  for (const d of weekDates) plannedUsersByDate[d] = new Set();
  for (const s of schedules) plannedUsersByDate[s.date]?.add(s.userId);

  // Week summary
  const totalScheduled = schedules.length;
  const totalSalesThisWeek = entries.reduce((s, e) => s + e.salesAmount, 0);
  const daysWithEntries = new Set(entries.map((e) => e.date)).size;

  function prevWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  }
  function nextWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  }
  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams({ week: weekStart, userId: filterUserId, ...overrides });
    return `/owner/schedule?${p.toString()}`;
  }
  function fmt(n: number) {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      maximumFractionDigits: 0,
    }).format(n);
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

          // entries by userId for quick lookup (for matching with planned slots)
          const actualByUser: Record<string, EntryGroup[]> = {};
          for (const eg of actualEntries) {
            if (!actualByUser[eg.userId]) actualByUser[eg.userId] = [];
            actualByUser[eg.userId].push(eg);
          }

          // entries with NO planned slot
          const unplannedEntries = actualEntries.filter(
            (eg) => !plannedUsersByDate[date]?.has(eg.userId)
          );

          return (
            <div key={date} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Day header */}
              <div className={`px-4 py-2.5 flex items-center justify-between ${date === today ? "bg-[#FFF8CC]" : ""}`}>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#1A1A1A]">{DAY_FULL[i]}</span>
                  <span className="text-gray-400 text-sm">{date}</span>
                  {date === today && <span className="text-xs text-[#F5A882] font-semibold">วันนี้</span>}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  {slots.length > 0 && <span>📋 {slots.length} แผน</span>}
                  {actualEntries.length > 0 && <span>✅ {actualEntries.length} รายการ</span>}
                </div>
              </div>

              {!hasAnything ? (
                <div className="px-4 py-3 text-xs text-gray-400">ยังไม่มีข้อมูล</div>
              ) : (
                <div className="divide-y divide-gray-50">

                  {/* ── แผนล่วงหน้า ── */}
                  {slots.map((s) => {
                    const userActuals = actualByUser[s.userId] ?? [];
                    const totalSales = userActuals.reduce((sum, g) => sum + g.salesAmount, 0);
                    const totalCount = userActuals.reduce((sum, g) => sum + g.count, 0);
                    const hasActual = userActuals.length > 0;

                    return (
                      <div key={s.id} className="px-4 py-3 bg-[#FFFBEB]">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <Avatar user={s.user as { name: string; profileImage?: string | null }} />
                            <div>
                              <div className="font-medium text-[#1A1A1A] text-sm">{s.user.name}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-1.5 flex-wrap mt-0.5">
                                <span className="text-[#F5A882] font-medium">📋 แผน</span>
                                <span>⏰ {s.startTime}–{s.endTime}</span>
                                {s.platform && (
                                  <span>{PLATFORM_EMOJI[s.platform]} {PLATFORM_LABELS[s.platform]}</span>
                                )}
                                {s.brand && (
                                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                                    style={{ background: (s.brand.color ?? "#ccc") + "22", color: s.brand.color ?? "#555" }}>
                                    {s.brand.name}
                                  </span>
                                )}
                                {s.note && <span className="text-gray-400">· {s.note}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isPast || date === today ? (
                              hasActual ? (
                                <div className="text-right">
                                  <div className="text-xs text-green-600 font-semibold">{fmt(totalSales)}</div>
                                  <div className="text-[10px] text-green-400">{totalCount} รายการ ✓</div>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-300 italic">ยังไม่บันทึก</span>
                              )
                            ) : null}
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
                              <span className="text-green-600 font-medium">✅ บันทึกแล้ว</span>
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

                  {/* ── บันทึกจริง ของคนที่มีแผน (แสดงรายละเอียดแยก platform) ── */}
                  {slots.length > 0 && (() => {
                    // แสดง actual ที่มีหลาย platform ให้เห็นแต่ละ platform
                    const usersWithPlan = new Set(slots.map((s) => s.userId));
                    const multiPlatformEntries = actualEntries.filter(
                      (eg) => usersWithPlan.has(eg.userId) && actualByUser[eg.userId]?.length > 1
                    );
                    if (multiPlatformEntries.length === 0) return null;
                    // dedupe by userId — show once per user's multiple platform rows
                    const shownUsers = new Set<string>();
                    return multiPlatformEntries
                      .filter((eg) => { if (shownUsers.has(`${eg.userId}__${eg.platform}`)) return false; shownUsers.add(`${eg.userId}__${eg.platform}`); return true; })
                      .map((eg, idx) => (
                        <div key={`multi-${idx}`} className="px-4 py-2 border-l-4 border-green-200 ml-4">
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                            <span>{PLATFORM_EMOJI[eg.platform]} {PLATFORM_LABELS[eg.platform]}</span>
                            {eg.brandName && <span className="text-gray-400">{eg.brandName}</span>}
                            <span className="ml-auto font-semibold text-green-600">{fmt(eg.salesAmount)}</span>
                          </div>
                        </div>
                      ));
                  })()}

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

// Avatar component
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
