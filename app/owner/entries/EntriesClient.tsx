"use client";

import { useState } from "react";
import { PLATFORM_LABELS, formatCurrency } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import DeleteEntryButton from "./DeleteEntryButton";
import EditEntryModal from "./EditEntryModal";

type Entry = {
  id: string; date: string; platform: string; salesAmount: number;
  notes: string | null; isBackdated: boolean; createdAt: string;
  userName: string; sessionName: string | null;
  customStart: string | null; customEnd: string | null;
  brandName: string | null; brandColor: string | null;
};

type Props = {
  entries: Entry[];
  employees: { id: string; name: string }[];
  totalSales: number;
  filters: { dateFrom: string; dateTo: string; userId: string; platform: string };
};

const PLATFORM_META: Record<string, { emoji: string; color: string; bg: string }> = {
  TIKTOK:   { emoji: "🎵", color: "#FF004F", bg: "#FF004F15" },
  SHOPEE:   { emoji: "🛒", color: "#EE4D2D", bg: "#EE4D2D15" },
  FACEBOOK: { emoji: "📘", color: "#1877F2", bg: "#1877F215" },
  OTHER:    { emoji: "📱", color: "#6B7280", bg: "#6B728018" },
};

function PlatformBadge({ platform }: { platform: string }) {
  const meta = PLATFORM_META[platform] ?? PLATFORM_META.OTHER;
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full leading-none"
      style={{ background: meta.bg, color: meta.color }}
    >
      {meta.emoji} {PLATFORM_LABELS[platform] ?? platform}
    </span>
  );
}

function downloadCsv(entries: Entry[]) {
  const rows = [
    ["วันที่", "พนักงาน", "Platform", "ช่วงเวลา", "ยอดขาย", "หมายเหตุ", "บันทึกเมื่อ"],
    ...entries.map(e => [
      e.date,
      e.userName,
      PLATFORM_LABELS[e.platform] ?? e.platform,
      e.sessionName || (e.customStart ? `${e.customStart}–${e.customEnd}` : "กำหนดเอง"),
      e.salesAmount.toString(),
      e.notes ?? "",
      new Date(e.createdAt).toLocaleString("th-TH"),
    ]),
  ];
  const csv  = "\uFEFF" + rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `entries-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function getTimeLabel(entry: Entry): string {
  const { customStart: s, customEnd: e, sessionName: sn } = entry;
  if (s === "09:00" && e === "16:00") return "☀️ เช้า";
  if (s === "16:00" && (e === "00:00" || e === "24:00")) return "🌙 เย็น";
  if (s && e) return `⏰ ${s}–${e}`;
  if (sn) return `⏰ ${sn}`;
  return "⏰ กำหนดเอง";
}

export default function EntriesClient({ entries, employees, totalSales, filters }: Props) {
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const isFiltered = !!(filters.dateFrom || filters.dateTo || filters.userId || filters.platform);

  return (
    <div className="p-4 space-y-4 max-w-3xl mx-auto animate-fade-in">

      {/* Page title */}
      <div className="pt-2">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">📋 รายการบันทึกทั้งหมด</h1>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">ค้นหา, กรอง, แก้ไข และส่งออก CSV</p>
      </div>

      {/* Filter card */}
      <form method="GET" action="/owner/entries"
        className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-4 border border-[#E5E7EB] dark:border-[#2A2A2A] space-y-3">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">🔍 กรองรายการ</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">ตั้งแต่วันที่</label>
            <input name="dateFrom" type="date" defaultValue={filters.dateFrom}
              className="w-full border border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#242424] text-gray-700 dark:text-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5D400]" />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">ถึงวันที่</label>
            <input name="dateTo" type="date" defaultValue={filters.dateTo}
              className="w-full border border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#242424] text-gray-700 dark:text-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5D400]" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">พนักงาน</label>
            <select name="userId" defaultValue={filters.userId}
              className="w-full border border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#242424] text-gray-700 dark:text-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5D400]">
              <option value="">ทั้งหมด</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Platform</label>
            <select name="platform" defaultValue={filters.platform}
              className="w-full border border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#242424] text-gray-700 dark:text-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5D400]">
              <option value="">ทั้งหมด</option>
              {Object.entries(PLATFORM_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit"
            className="flex-1 h-10 rounded-xl font-semibold text-sm text-[#1A1A1A]"
            style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}>
            ค้นหา
          </button>
          {isFiltered && (
            <a href="/owner/entries"
              className="flex items-center justify-center px-4 h-10 rounded-xl border border-gray-200 dark:border-[#2A2A2A] text-gray-500 dark:text-gray-400 text-sm hover:bg-gray-50 dark:hover:bg-[#242424] transition-colors">
              ล้าง ✕
            </a>
          )}
        </div>
      </form>

      {/* Summary bar */}
      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-4 border-l-4 border-[#F5D400] border border-[#E5E7EB] dark:border-[#2A2A2A] flex justify-between items-center">
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{entries.length} รายการ{isFiltered ? " (กรองแล้ว)" : ""}</div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalSales)}</div>
        </div>
        <button
          onClick={() => downloadCsv(entries)}
          disabled={entries.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-green-100 dark:hover:bg-green-950 transition-colors"
        >
          📥 CSV
        </button>
      </div>

      {/* Entry list */}
      {entries.length === 0 ? (
        <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-[#E5E7EB] dark:border-[#2A2A2A]">
          <EmptyState
            icon="📋"
            title="ไม่พบรายการ"
            description={isFiltered ? "ลองเปลี่ยนตัวกรอง หรือกดล้างเพื่อดูทั้งหมด" : "ยังไม่มีรายการบันทึก"}
            action={
              isFiltered ? (
                <a href="/owner/entries"
                  className="text-xs font-semibold text-[#F5D400] hover:opacity-80 transition-opacity">
                  ล้างตัวกรอง →
                </a>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map(entry => {
            const meta = PLATFORM_META[entry.platform] ?? PLATFORM_META.OTHER;
            return (
              <div key={entry.id}
                className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-4 border border-[#E5E7EB] dark:border-[#2A2A2A] border-l-[3px] transition-all hover:shadow-sm dark:hover:border-[#3A3A3A]"
                style={{ borderLeftColor: meta.color }}>
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    {/* top row: name + badges */}
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">{entry.userName}</span>
                      <PlatformBadge platform={entry.platform} />
                      {entry.brandName && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-full"
                          style={{
                            background: entry.brandColor ? entry.brandColor + "20" : "#f3f4f6",
                            color: entry.brandColor ?? "#6B7280",
                          }}>
                          <span className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0" style={{ background: entry.brandColor ?? "#ccc" }} />
                          {entry.brandName}
                        </span>
                      )}
                      {entry.isBackdated && (
                        <span className="text-[10px] text-orange-400 dark:text-orange-500 font-medium">ย้อนหลัง</span>
                      )}
                    </div>
                    {/* meta row */}
                    <div className="text-xs text-gray-400 dark:text-gray-500 flex flex-wrap gap-x-2 gap-y-0.5">
                      <span>📅 {entry.date}</span>
                      <span>{getTimeLabel(entry)}</span>
                    </div>
                    {entry.notes && (
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">📝 {entry.notes}</div>
                    )}
                    <div className="text-[10px] text-gray-300 dark:text-gray-600 mt-1">
                      บันทึก {new Date(entry.createdAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
                    </div>
                  </div>
                  {/* right: amount + actions */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="font-bold text-green-600 dark:text-green-400 text-sm">{formatCurrency(entry.salesAmount)}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingEntry(entry)}
                        className="text-xs px-2 py-1 rounded-lg bg-gray-100 dark:bg-[#242424] text-gray-500 dark:text-gray-400 hover:bg-[#FFF8CC] dark:hover:bg-[#2A2200] hover:text-[#1A1A1A] dark:hover:text-[#F5D400] transition-all">
                        ✏️
                      </button>
                      <DeleteEntryButton id={entry.id} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit modal */}
      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </div>
  );
}
