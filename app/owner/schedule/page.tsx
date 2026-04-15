export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
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

  const [employees, schedules] = await Promise.all([
    prisma.user.findMany({ where: { role: "EMPLOYEE", isActive: true }, orderBy: { name: "asc" } }),
    prisma.workSchedule.findMany({
      where: {
        date: { gte: weekDates[0], lte: weekEnd },
        ...(filterUserId ? { userId: filterUserId } : {}),
      },
      include: { user: true },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
  ]);

  // Group by date
  const byDate: Record<string, typeof schedules> = {};
  for (const d of weekDates) byDate[d] = [];
  for (const s of schedules) {
    if (!byDate[s.date]) byDate[s.date] = [];
    byDate[s.date].push(s);
  }

  // Prev / next week
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

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[#1A1A1A] pt-2">📅 ตารางไลฟ์</h1>

      {/* Week navigator */}
      <div className="bg-white rounded-2xl p-3 shadow-sm flex items-center justify-between">
        <a href={buildUrl({ week: prevWeek() })}
          className="w-10 h-10 flex items-center justify-center rounded-xl border-2 border-gray-200 text-gray-600 hover:border-[#F5D400]">‹</a>
        <div className="text-center">
          <div className="font-semibold text-[#1A1A1A]">
            {weekDates[0].slice(5)} – {weekDates[6].slice(5)}
          </div>
          <div className="text-xs text-gray-400">{weekStart.slice(0, 7)}</div>
        </div>
        <a href={buildUrl({ week: nextWeek() })}
          className="w-10 h-10 flex items-center justify-center rounded-xl border-2 border-gray-200 text-gray-600 hover:border-[#F5D400]">›</a>
      </div>

      {/* Day pills */}
      <div className="grid grid-cols-7 gap-1">
        {weekDates.map((date, i) => {
          const isToday = date === today;
          const hasSchedule = byDate[date]?.length > 0;
          return (
            <div key={date} className={`flex flex-col items-center p-1.5 rounded-xl text-xs ${
              isToday ? "bg-[#F5D400] font-bold" : "bg-white"
            }`}>
              <span className="text-gray-500">{DAY_LABELS[i]}</span>
              <span className={`font-semibold ${isToday ? "text-[#1A1A1A]" : "text-gray-700"}`}>{date.slice(8)}</span>
              {hasSchedule && <div className="w-1.5 h-1.5 rounded-full bg-[#F5A882] mt-0.5" />}
            </div>
          );
        })}
      </div>

      {/* Filter by employee */}
      <div className="flex gap-2 flex-wrap">
        <a href={buildUrl({ userId: "" })}
          className={`text-xs px-3 py-1.5 rounded-full border-2 font-medium transition-all ${!filterUserId ? "border-[#F5D400] bg-[#FFF8CC]" : "border-gray-200 text-gray-500"}`}>
          ทั้งหมด
        </a>
        {employees.map(e => (
          <a key={e.id} href={buildUrl({ userId: e.id })}
            className={`text-xs px-3 py-1.5 rounded-full border-2 font-medium transition-all ${filterUserId === e.id ? "border-[#F5D400] bg-[#FFF8CC]" : "border-gray-200 text-gray-500"}`}>
            {e.name}
          </a>
        ))}
      </div>

      {/* Schedule by day */}
      <div className="space-y-3">
        {weekDates.map((date, i) => (
          <div key={date} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className={`px-4 py-2.5 flex items-center justify-between ${date === today ? "bg-[#FFF8CC]" : ""}`}>
              <div>
                <span className="font-semibold text-[#1A1A1A]">{DAY_FULL[i]}</span>
                <span className="text-gray-400 text-sm ml-2">{date}</span>
                {date === today && <span className="ml-2 text-xs text-[#F5A882] font-semibold">วันนี้</span>}
              </div>
              <span className="text-xs text-gray-400">{byDate[date]?.length || 0} รายการ</span>
            </div>

            {byDate[date]?.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {byDate[date].map(s => (
                  <div key={s.id} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#F5D400] flex-shrink-0">
                        {(s.user as { profileImage?: string }).profileImage ? (
                          <img src={(s.user as { profileImage?: string }).profileImage!} alt={s.user.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-[#FFF8CC] flex items-center justify-center text-xs font-bold">{s.user.name.slice(0,1)}</div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-[#1A1A1A] text-sm">{s.user.name}</div>
                        <div className="text-xs text-gray-500">{s.startTime} – {s.endTime} น.{s.note ? ` · ${s.note}` : ""}</div>
                      </div>
                    </div>
                    <DeleteScheduleButton id={s.id} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-3 text-xs text-gray-400">ยังไม่มีตาราง</div>
            )}
          </div>
        ))}
      </div>

      {/* Add schedule form */}
      <ScheduleForm employees={employees.map(e => ({ id: e.id, name: e.name }))} defaultWeek={weekStart} />
    </div>
  );
}
