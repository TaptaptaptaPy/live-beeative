export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import type { LogAction } from "@/app/generated/prisma/client";
import PinGate from "./PinGate";

type ActionMeta = { label: string; emoji: string; color: string; darkColor: string; category: string };

const ACTION_LABELS: Record<string, ActionMeta> = {
  LOGIN:             { label: "เข้าสู่ระบบ",        emoji: "🔑", color: "text-blue-700 bg-blue-50",      darkColor: "dark:text-blue-300 dark:bg-blue-950/50",    category: "ระบบ" },
  LOGOUT:            { label: "ออกจากระบบ",         emoji: "🚪", color: "text-gray-600 bg-gray-100",     darkColor: "dark:text-gray-300 dark:bg-[#242424]",       category: "ระบบ" },
  PIN_SET:           { label: "ตั้ง PIN",            emoji: "🔐", color: "text-blue-700 bg-blue-50",      darkColor: "dark:text-blue-300 dark:bg-blue-950/50",    category: "ระบบ" },
  PROFILE_UPDATE:    { label: "อัปเดตโปรไฟล์",      emoji: "👤", color: "text-blue-700 bg-blue-50",      darkColor: "dark:text-blue-300 dark:bg-blue-950/50",    category: "ระบบ" },
  ENTRY_CREATE:      { label: "บันทึกยอด",          emoji: "✅", color: "text-green-700 bg-green-50",    darkColor: "dark:text-green-300 dark:bg-green-950/50",  category: "ยอดขาย" },
  ENTRY_EDIT:        { label: "แก้ไขรายการยอด",     emoji: "✏️", color: "text-yellow-700 bg-yellow-50",  darkColor: "dark:text-yellow-300 dark:bg-yellow-950/50",category: "ยอดขาย" },
  ENTRY_DELETE:      { label: "ลบรายการยอด",        emoji: "🗑️", color: "text-red-700 bg-red-50",        darkColor: "dark:text-red-300 dark:bg-red-950/50",      category: "ยอดขาย" },
  BULK_ENTRY_CREATE: { label: "ลงยอดย้อนหลัง",     emoji: "📥", color: "text-orange-700 bg-orange-50",  darkColor: "dark:text-orange-300 dark:bg-orange-950/50",category: "ยอดขาย" },
  EMPLOYEE_CREATE:   { label: "เพิ่มพนักงาน",       emoji: "👤", color: "text-teal-700 bg-teal-50",      darkColor: "dark:text-teal-300 dark:bg-teal-950/50",    category: "พนักงาน" },
  EMPLOYEE_UPDATE:   { label: "แก้ไขพนักงาน",       emoji: "✏️", color: "text-yellow-700 bg-yellow-50",  darkColor: "dark:text-yellow-300 dark:bg-yellow-950/50",category: "พนักงาน" },
  EMPLOYEE_DELETE:   { label: "ลบพนักงาน",          emoji: "🗑️", color: "text-red-700 bg-red-50",        darkColor: "dark:text-red-300 dark:bg-red-950/50",      category: "พนักงาน" },
  EXPENSE_CREATE:    { label: "บันทึกค่าใช้จ่าย",   emoji: "💸", color: "text-purple-700 bg-purple-50",  darkColor: "dark:text-purple-300 dark:bg-purple-950/50",category: "การเงิน" },
  EXPENSE_DELETE:    { label: "ลบค่าใช้จ่าย",      emoji: "🗑️", color: "text-red-700 bg-red-50",        darkColor: "dark:text-red-300 dark:bg-red-950/50",      category: "การเงิน" },
  TARGET_UPDATE:     { label: "อัปเดตเป้ายอด/งบ",  emoji: "🎯", color: "text-indigo-700 bg-indigo-50",  darkColor: "dark:text-indigo-300 dark:bg-indigo-950/50",category: "การเงิน" },
  SCHEDULE_CREATE:   { label: "เพิ่มตารางไลฟ์",    emoji: "📅", color: "text-teal-700 bg-teal-50",      darkColor: "dark:text-teal-300 dark:bg-teal-950/50",    category: "ตาราง" },
  SCHEDULE_DELETE:   { label: "ลบตารางไลฟ์",       emoji: "🗑️", color: "text-red-700 bg-red-50",        darkColor: "dark:text-red-300 dark:bg-red-950/50",      category: "ตาราง" },
  LEAVE_UPDATE:      { label: "อัปเดตวันลา",        emoji: "🏖️", color: "text-orange-700 bg-orange-50",  darkColor: "dark:text-orange-300 dark:bg-orange-950/50",category: "วันลา" },
  SESSION_CREATE:    { label: "เพิ่มช่วงเวลาไลฟ์",  emoji: "⏰", color: "text-indigo-700 bg-indigo-50",  darkColor: "dark:text-indigo-300 dark:bg-indigo-950/50",category: "ระบบ" },
  SESSION_DELETE:    { label: "ลบช่วงเวลาไลฟ์",    emoji: "⏰", color: "text-red-700 bg-red-50",        darkColor: "dark:text-red-300 dark:bg-red-950/50",      category: "ระบบ" },
};

const CATEGORIES = ["ทั้งหมด", "ยอดขาย", "พนักงาน", "การเงิน", "ตาราง", "วันลา", "ระบบ"];

function formatDateTime(d: Date) {
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    timeZone: "Asia/Bangkok",
  }).format(d);
}

function categoryToActions(category: string): string[] {
  if (category === "ทั้งหมด" || !category) return [];
  return Object.entries(ACTION_LABELS)
    .filter(([, v]) => v.category === category)
    .map(([k]) => k);
}

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; userId?: string; category?: string; page?: string }>;
}) {
  const params   = await searchParams;
  const action   = params.action   || "";
  const userId   = params.userId   || "";
  const category = params.category || "ทั้งหมด";
  const page     = Math.max(1, parseInt(params.page || "1", 10));
  const PAGE_SIZE = 50;

  const actionFilter: string[] = action
    ? [action]
    : categoryToActions(category);

  const whereBase = {
    ...(userId ? { userId } : {}),
    ...(actionFilter.length > 0 ? { action: { in: actionFilter as LogAction[] } } : {}),
  };

  const [logs, employees, total] = await Promise.all([
    prisma.activityLog.findMany({
      where: whereBase, orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE,
    }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.activityLog.count({ where: whereBase }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams({ action, userId, category, page: String(page), ...overrides });
    return `/owner/logs?${p.toString()}`;
  }

  return (
    <PinGate>
    <div className="p-4 space-y-4 max-w-2xl mx-auto animate-fade-in">
      <div className="pt-2">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">🗒️ ประวัติกิจกรรม</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">บันทึกการใช้งานระบบทั้งหมด ({total} รายการ)</p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <a key={cat} href={buildUrl({ category: cat, action: "", page: "1" })}
            className={`text-xs px-3 py-1.5 rounded-full border-2 font-medium transition-all ${
              category === cat
                ? "border-[#F5D400] bg-[#FFF8CC] dark:bg-[#2A2200] text-[#1A1A1A] dark:text-[#F5D400]"
                : "border-gray-200 dark:border-[#2A2A2A] text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-[#3A3A3A]"
            }`}>
            {cat}
          </a>
        ))}
      </div>

      {/* Filters */}
      <form method="GET" action="/owner/logs"
        className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-4 border border-[#E5E7EB] dark:border-[#2A2A2A] space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">ประเภทกิจกรรม</label>
            <select name="action" defaultValue={action}
              className="w-full border border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#242424] text-gray-700 dark:text-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5D400]">
              <option value="">ทั้งหมด</option>
              {Object.entries(ACTION_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v.emoji} {v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">ผู้ใช้</label>
            <select name="userId" defaultValue={userId}
              className="w-full border border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#242424] text-gray-700 dark:text-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5D400]">
              <option value="">ทั้งหมด</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
        </div>
        <input type="hidden" name="category" value={category} />
        <input type="hidden" name="page" value="1" />
        <button type="submit"
          className="w-full h-10 rounded-xl font-semibold text-sm text-[#1A1A1A]"
          style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}>
          กรองข้อมูล
        </button>
      </form>

      {/* Log list */}
      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-[#E5E7EB] dark:border-[#2A2A2A] overflow-hidden">
        {logs.length === 0 ? (
          <div className="py-10 text-center">
            <div className="text-3xl mb-2">📭</div>
            <p className="text-gray-400 dark:text-gray-500 text-sm">ไม่มีข้อมูลในเงื่อนไขนี้</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-[#222]">
            {logs.map((log) => {
              const meta = ACTION_LABELS[log.action] ?? {
                label: log.action, emoji: "📌",
                color: "text-gray-600 bg-gray-50", darkColor: "dark:text-gray-300 dark:bg-[#242424]",
                category: "อื่นๆ",
              };
              let details: Record<string, unknown> = {};
              try { details = JSON.parse(log.details ?? "{}"); } catch { /**/ }

              return (
                <div key={log.id} className="p-3 hover:bg-[#FFFBEB] dark:hover:bg-[#1C1800] transition-colors">
                  <div className="flex items-start gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap mt-0.5 flex-shrink-0 ${meta.color} ${meta.darkColor}`}>
                      {meta.emoji} {meta.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 dark:text-white text-sm">{log.userName}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {log.userRole === "OWNER" ? "เจ้าของ" : "พนักงาน"}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-[#242424] px-1.5 rounded">{meta.category}</span>
                      </div>
                      {Object.keys(details).length > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex flex-wrap gap-x-3">
                          {Object.entries(details).map(([k, v]) => (
                            <span key={k}>{k}: <span className="text-gray-900 dark:text-white font-medium">{String(v)}</span></span>
                          ))}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDateTime(new Date(log.createdAt))}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-[#1A1A1A] rounded-2xl p-3 border border-[#E5E7EB] dark:border-[#2A2A2A]">
          <a href={page > 1 ? buildUrl({ page: String(page - 1) }) : "#"}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              page > 1
                ? "border border-gray-200 dark:border-[#2A2A2A] text-gray-600 dark:text-gray-300 hover:border-[#F5D400]"
                : "text-gray-300 dark:text-gray-700 pointer-events-none"
            }`}>
            ← ก่อนหน้า
          </a>
          <span className="text-sm text-gray-500 dark:text-gray-400">หน้า {page} / {totalPages}</span>
          <a href={page < totalPages ? buildUrl({ page: String(page + 1) }) : "#"}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              page < totalPages
                ? "border border-gray-200 dark:border-[#2A2A2A] text-gray-600 dark:text-gray-300 hover:border-[#F5D400]"
                : "text-gray-300 dark:text-gray-700 pointer-events-none"
            }`}>
            ถัดไป →
          </a>
        </div>
      )}
    </div>
    </PinGate>
  );
}
