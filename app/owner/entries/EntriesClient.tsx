"use client";

import { useState } from "react";
import { PLATFORM_LABELS, formatCurrency } from "@/lib/utils";
import DeleteEntryButton from "./DeleteEntryButton";
import EditEntryModal from "./EditEntryModal";

type Entry = {
  id: string; date: string; platform: string; salesAmount: number;
  notes: string | null; isBackdated: boolean; createdAt: string;
  userName: string; sessionName: string | null;
  customStart: string | null; customEnd: string | null;
};

type Props = {
  entries: Entry[];
  employees: { id: string; name: string }[];
  totalSales: number;
  filters: { dateFrom: string; dateTo: string; userId: string; platform: string };
};

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
  const csv = "\uFEFF" + rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `entries-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function EntriesClient({ entries, employees, totalSales, filters }: Props) {
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[#1A1A1A] pt-2">📋 รายการบันทึกทั้งหมด</h1>

      {/* Filters */}
      <form method="GET" action="/owner/entries" className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">ตั้งแต่วันที่</label>
            <input name="dateFrom" type="date" defaultValue={filters.dateFrom}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#F5D400]" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">ถึงวันที่</label>
            <input name="dateTo" type="date" defaultValue={filters.dateTo}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#F5D400]" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">พนักงาน</label>
            <select name="userId" defaultValue={filters.userId}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#F5D400]">
              <option value="">ทั้งหมด</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Platform</label>
            <select name="platform" defaultValue={filters.platform}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#F5D400]">
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
          <a href="/owner/entries"
            className="flex items-center justify-center px-4 h-10 rounded-xl border-2 border-gray-200 text-gray-500 text-sm">
            ล้าง
          </a>
        </div>
      </form>

      {/* Summary + CSV export */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-[#F5D400] flex justify-between items-center">
        <div>
          <div className="text-sm text-gray-500">{entries.length} รายการ</div>
          <div className="text-xl font-bold text-[#1A1A1A]">{formatCurrency(totalSales)}</div>
        </div>
        <button
          onClick={() => downloadCsv(entries)}
          disabled={entries.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-medium disabled:opacity-40"
        >
          📥 CSV
        </button>
      </div>

      {/* List */}
      {entries.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm">ไม่พบรายการ</div>
      ) : (
        <div className="space-y-2">
          {entries.map(entry => (
            <div key={entry.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-[#1A1A1A]">{entry.userName}</span>
                    <span className="text-xs bg-[#FFF8CC] text-[#1A1A1A] px-2 py-0.5 rounded-full">
                      {PLATFORM_LABELS[entry.platform]}
                    </span>
                    {entry.isBackdated && (
                      <span className="text-xs text-orange-400">(ย้อนหลัง)</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    📅 {entry.date} · ⏰ {entry.sessionName || (entry.customStart ? `${entry.customStart}–${entry.customEnd}` : "กำหนดเอง")}
                  </div>
                  {entry.notes && <div className="text-xs text-gray-400 mt-1">📝 {entry.notes}</div>}
                  <div className="text-xs text-gray-300 mt-1">
                    บันทึก {new Date(entry.createdAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="font-bold text-green-600">{formatCurrency(entry.salesAmount)}</span>
                  <button onClick={() => setEditingEntry(entry)}
                    className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-500 hover:bg-[#FFF8CC] hover:text-[#1A1A1A] transition-all">
                    ✏️
                  </button>
                  <DeleteEntryButton id={entry.id} />
                </div>
              </div>
            </div>
          ))}
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
