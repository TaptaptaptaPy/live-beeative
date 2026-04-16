export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import type { LogAction } from "@/app/generated/prisma/client";
import PinGate from "./PinGate";

// ── Action metadata ────────────────────────────────────────────────────────

type ActionMeta = { label: string; emoji: string; color: string; category: string };

const ACTION_LABELS: Record<string, ActionMeta> = {
  // การเข้าถึงระบบ
  LOGIN:             { label: "เข้าสู่ระบบ",        emoji: "🔑", color: "text-blue-600 bg-blue-50",     category: "ระบบ" },
  LOGOUT:            { label: "ออกจากระบบ",         emoji: "🚪", color: "text-gray-600 bg-gray-100",    category: "ระบบ" },
  PIN_SET:           { label: "ตั้ง PIN",            emoji: "🔐", color: "text-blue-600 bg-blue-50",     category: "ระบบ" },
  PROFILE_UPDATE:    { label: "อัปเดตโปรไฟล์",      emoji: "👤", color: "text-blue-600 bg-blue-50",     category: "ระบบ" },
  // ยอดขาย
  ENTRY_CREATE:      { label: "บันทึกยอด",          emoji: "✅", color: "text-green-600 bg-green-50",   category: "ยอดขาย" },
  ENTRY_EDIT:        { label: "แก้ไขรายการยอด",     emoji: "✏️", color: "text-yellow-700 bg-yellow-50", category: "ยอดขาย" },
  ENTRY_DELETE:      { label: "ลบรายการยอด",        emoji: "🗑️", color: "text-red-600 bg-red-50",       category: "ยอดขาย" },
  BULK_ENTRY_CREATE: { label: "ลงยอดย้อนหลัง",     emoji: "📥", color: "text-orange-600 bg-orange-50", category: "ยอดขาย" },
  // พนักงาน
  EMPLOYEE_CREATE:   { label: "เพิ่มพนักงาน",       emoji: "👤", color: "text-teal-600 bg-teal-50",     category: "พนักงาน" },
  EMPLOYEE_UPDATE:   { label: "แก้ไขพนักงาน",       emoji: "✏️", color: "text-yellow-700 bg-yellow-50", category: "พนักงาน" },
  EMPLOYEE_DELETE:   { label: "ลบพนักงาน",          emoji: "🗑️", color: "text-red-600 bg-red-50",       category: "พนักงาน" },
  // การเงิน
  EXPENSE_CREATE:    { label: "บันทึกค่าใช้จ่าย",   emoji: "💸", color: "text-purple-600 bg-purple-50", category: "การเงิน" },
  EXPENSE_DELETE:    { label: "ลบค่าใช้จ่าย",      emoji: "🗑️", color: "text-red-600 bg-red-50",       category: "การเงิน" },
  TARGET_UPDATE:     { label: "อัปเดตเป้ายอด/งบ",  emoji: "🎯", color: "text-indigo-600 bg-indigo-50",  category: "การเงิน" },
  // ตาราง & วันลา
  SCHEDULE_CREATE:   { label: "เพิ่มตารางไลฟ์",    emoji: "📅", color: "text-teal-600 bg-teal-50",     category: "ตาราง" },
  SCHEDULE_DELETE:   { label: "ลบตารางไลฟ์",       emoji: "🗑️", color: "text-red-600 bg-red-50",       category: "ตาราง" },
  LEAVE_UPDATE:      { label: "อัปเดตวันลา",        emoji: "🏖️", color: "text-orange-600 bg-orange-50", category: "วันลา" },
  // ระบบ
  SESSION_CREATE:    { label: "เพิ่มช่วงเวลาไลฟ์",  emoji: "⏰", color: "text-indigo-600 bg-indigo-50",  category: "ระบบ" },
  SESSION_DELETE:    { label: "ลบช่วงเวลาไลฟ์",    emoji: "⏰", color: "text-red-600 bg-red-50",       category: "ระบบ" },
};

const CATEGORIES = ["ทั้งหมด", "ยอดขาย", "พนักงาน", "การเงิน", "ตาราง", "วันลา", "ระบบ"];

function formatDateTime(d: Date) {
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    timeZone: "Asia/Bangkok",
  }).format(d);
}

// Map category → actions for DB filter
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
  const params = await searchParams;
  const action = params.action || "";
  const userId = params.userId || "";
  const category = params.category || "ทั้งหมด";
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const PAGE_SIZE = 50;

  // Build action filter from category or explicit action
  const actionFilter: string[] = action
    ? [action]
    : categoryToActions(category);

  const whereBase = {
    ...(userId ? { userId } : {}),
    ...(actionFilter.length > 0 ? { action: { in: actionFilter as LogAction[] } } : {}),
  };

  const [logs, employees, total] = await Promise.all([
    prisma.activityLog.findMany({
      where: whereBase,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
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
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">🗒️ ประวัติกิจกรรม</h1>
        <p className="text-sm text-gray-500 mt-1">บันทึกการใช้งานระบบทั้งหมด ({total} รายการ)</p>
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <a key={cat} href={buildUrl({ category: cat, action: "", page: "1" })}
            className={`text-xs px-3 py-1.5 rounded-full border-2 font-medium transition-all ${
              category === cat ? "border-[#F5D400] bg-[#FFF8CC] text-[#1A1A1A]" : "border-gray-200 text-gray-500"
            }`}>
            {cat}
          </a>
        ))}
      </div>

      {/* User filter + action filter */}
      <form method="GET" action="/owner/logs" className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">ประเภทกิจกรรม</label>
            <select name="action" defaultValue={action}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#F5D400]">
              <option value="">ทั้งหมด</option>
              {Object.entries(ACTION_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v.emoji} {v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">ผู้ใช้</label>
            <select name="userId" defaultValue={userId}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#F5D400]">
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

      {/* Log List */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <p className="text-gray-400 text-center py-8">ไม่มีข้อมูลในเงื่อนไขนี้</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {logs.map((log) => {
              const meta = ACTION_LABELS[log.action] ?? { label: log.action, emoji: "📌", color: "text-gray-600 bg-gray-50", category: "อื่นๆ" };
              let details: Record<string, unknown> = {};
              try { details = JSON.parse(log.details ?? "{}"); } catch { /**/ }

              return (
                <div key={log.id} className="p-3 hover:bg-[#FFFBEB] transition-colors">
                  <div className="flex items-start gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap mt-0.5 flex-shrink-0 ${meta.color}`}>
                      {meta.emoji} {meta.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[#1A1A1A] text-sm">{log.userName}</span>
                        <span className="text-xs text-gray-400">
                          {log.userRole === "OWNER" ? "เจ้าของ" : "พนักงาน"}
                        </span>
                        <span className="text-xs text-gray-300 bg-gray-50 px-1.5 rounded">{meta.category}</span>
                      </div>
                      {Object.keys(details).length > 0 && (
                        <div className="text-xs text-gray-500 mt-0.5 flex flex-wrap gap-x-3">
                          {Object.entries(details).map(([k, v]) => (
                            <span key={k}>{k}: <span className="text-[#1A1A1A] font-medium">{String(v)}</span></span>
                          ))}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-0.5">{formatDateTime(new Date(log.createdAt))}</div>
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
        <div className="flex items-center justify-between bg-white rounded-2xl p-3 shadow-sm">
          <a href={page > 1 ? buildUrl({ page: String(page - 1) }) : "#"}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              page > 1 ? "border-2 border-gray-200 text-gray-600 hover:border-[#F5D400]" : "text-gray-300 pointer-events-none"
            }`}>
            ← ก่อนหน้า
          </a>
          <span className="text-sm text-gray-500">หน้า {page} / {totalPages}</span>
          <a href={page < totalPages ? buildUrl({ page: String(page + 1) }) : "#"}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              page < totalPages ? "border-2 border-gray-200 text-gray-600 hover:border-[#F5D400]" : "text-gray-300 pointer-events-none"
            }`}>
            ถัดไป →
          </a>
        </div>
      )}
    </div>
    </PinGate>
  );
}
