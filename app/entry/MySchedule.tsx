"use client";

import { useEffect, useState } from "react";

type Schedule = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  note: string | null;
};

const DAY_LABELS: Record<number, string> = {
  0: "อา", 1: "จ", 2: "อ", 3: "พ", 4: "พฤ", 5: "ศ", 6: "ส",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const day = DAY_LABELS[d.getDay()];
  const dd = d.getDate();
  const mm = d.getMonth() + 1;
  return { day, label: `${day} ${dd}/${mm}` };
}

function isTomorrow(dateStr: string) {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return dateStr === t.toISOString().slice(0, 10);
}

function googleCalUrl(s: Schedule) {
  const fmt = (date: string, time: string) => {
    const [y, m, d] = date.split("-");
    const [h, min] = time.split(":");
    return `${y}${m}${d}T${h}${min}00`;
  };
  const title = encodeURIComponent(s.note ? `🐝 ไลฟ์ — ${s.note}` : "🐝 ตารางไลฟ์");
  const start = fmt(s.date, s.startTime);
  const end   = fmt(s.date, s.endTime);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=Beeative+LiveBoard`;
}

export default function MySchedule() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [open, setOpen]           = useState(false);
  const [loading, setLoading]     = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    setLoading(true);
    fetch("/api/my-schedule")
      .then(r => r.json())
      .then((data: Schedule[]) => {
        setSchedules(data);
        if (data.some(s => s.date === today)) setOpen(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [today]);

  if (!loading && schedules.length === 0) {
    return (
      <div className="mx-4 mt-3">
        <div className="bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-[#2A2A2A] rounded-2xl px-4 py-3 flex items-center gap-2">
          <span className="text-lg">📅</span>
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">ตารางไลฟ์ของฉัน</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">ยังไม่มีตารางในช่วงนี้</p>
          </div>
        </div>
      </div>
    );
  }

  const todaySchedules    = schedules.filter(s => s.date === today);
  const upcomingSchedules = schedules.filter(s => s.date !== today);

  return (
    <div className="mx-4 mt-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between bg-[#FFF8CC] dark:bg-[#1C1800] border-2 border-[#F5D400] rounded-2xl px-4 py-3 text-sm font-semibold text-[#1A1A1A] dark:text-[#F5D400]"
      >
        <span className="flex items-center gap-2">
          📅 ตารางไลฟ์ของฉัน
          {todaySchedules.length > 0 && (
            <span className="bg-[#F5A882] text-white text-xs px-2 py-0.5 rounded-full font-bold">
              วันนี้ {todaySchedules.length}
            </span>
          )}
        </span>
        <span className="text-gray-400 dark:text-gray-500 text-base">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="bg-white dark:bg-[#1A1A1A] border-2 border-[#F5D400] border-t-0 rounded-b-2xl shadow-sm dark:shadow-none pb-3">
          {/* Today */}
          {todaySchedules.length > 0 && (
            <div className="px-4 pt-3">
              <div className="text-xs font-bold text-[#F5A882] uppercase mb-2">วันนี้</div>
              <div className="space-y-2">
                {todaySchedules.map(s => <ScheduleCard key={s.id} s={s} highlight />)}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {upcomingSchedules.length > 0 && (
            <div className="px-4 pt-3">
              <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">ตารางที่จะมาถึง</div>
              <div className="space-y-2">
                {upcomingSchedules.map(s => <ScheduleCard key={s.id} s={s} />)}
              </div>
            </div>
          )}

          {/* Export all */}
          <div className="px-4 pt-3 flex gap-2">
            <a
              href="/api/my-schedule/ics"
              download="my-live-schedule.ics"
              className="flex-1 text-center text-xs py-2.5 rounded-xl border-2 border-[#F5D400] text-[#1A1A1A] dark:text-[#F5D400] font-semibold hover:bg-[#FFF8CC] dark:hover:bg-[#1C1800] transition-all"
            >
              📥 ดาวน์โหลดทั้งหมด (.ics)
            </a>
          </div>
          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2 px-4">
            ไฟล์ .ics เปิดกับปฏิทิน iPhone / Android / Google ได้เลย
          </p>
        </div>
      )}
    </div>
  );
}

function ScheduleCard({ s, highlight }: { s: Schedule; highlight?: boolean }) {
  const { label } = formatDate(s.date);
  const tomorrow  = isTomorrow(s.date);

  return (
    <div className={`rounded-xl p-3 flex items-center justify-between gap-2 ${
      highlight
        ? "bg-[#FFF8CC] dark:bg-[#2A2200]"
        : "bg-gray-50 dark:bg-[#141414]"
    }`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            highlight
              ? "bg-[#F5A882] text-white"
              : "bg-gray-200 dark:bg-[#2A2A2A] text-gray-600 dark:text-gray-300"
          }`}>
            {label}{tomorrow && " (พรุ่งนี้)"}
          </span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {s.startTime} – {s.endTime} น.
          </span>
        </div>
        {s.note && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">📌 {s.note}</div>
        )}
      </div>

      <div className="flex gap-1.5 flex-shrink-0">
        <a
          href={googleCalUrl(s)}
          target="_blank"
          rel="noopener noreferrer"
          title="เพิ่มใน Google Calendar"
          className="w-8 h-8 rounded-lg bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] flex items-center justify-center text-base hover:border-[#F5D400] transition-all shadow-sm dark:shadow-none"
        >
          🗓️
        </a>
        <a
          href={`/api/my-schedule/ics?id=${s.id}`}
          download={`live-${s.date}.ics`}
          title="เพิ่มในปฏิทิน iPhone/Android"
          className="w-8 h-8 rounded-lg bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] flex items-center justify-center text-base hover:border-[#F5D400] transition-all shadow-sm dark:shadow-none"
        >
          📥
        </a>
      </div>
    </div>
  );
}
