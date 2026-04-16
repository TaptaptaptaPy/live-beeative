"use client";

import { useEffect, useState } from "react";
import { updateEntry } from "@/app/actions/entries";

const PLATFORM_LABELS: Record<string, string> = {
  TIKTOK: "TikTok", SHOPEE: "Shopee", FACEBOOK: "Facebook", OTHER: "อื่นๆ",
};

type Entry = {
  id: string; date: string; platform: string; salesAmount: number;
  notes: string | null; createdAt: string;
  sessionName: string | null; customStart: string | null; customEnd: string | null;
};

// แมปเวลา → ชื่อช่วง
function getTimeLabel(sessionName: string | null, start: string | null, end: string | null): string {
  if (start === "09:00" && end === "16:00") return "☀️ เช้า";
  if (start === "16:00" && (end === "00:00" || end === "24:00")) return "🌙 เย็น";
  if (start && end) return `⏰ ${start}–${end}`;
  if (sessionName) return `⏰ ${sessionName}`;
  return "";
}

export default function MyRecentEntries() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      fetch("/api/my-entries").then(r => r.json()).then(setEntries).catch(() => {});
    }
  }, [open]);

  function startEdit(entry: Entry) {
    setEditingId(entry.id);
    setEditAmount(String(entry.salesAmount));
    setEditNotes(entry.notes || "");
    setError("");
  }

  async function submitEdit(id: string) {
    setLoading(true); setError("");
    const fd = new FormData();
    fd.append("id", id);
    fd.append("salesAmount", editAmount);
    fd.append("notes", editNotes);
    const result = await updateEntry(fd);
    if (result?.error) setError(result.error);
    else {
      setEditingId(null);
      const updated = await fetch("/api/my-entries").then(r => r.json());
      setEntries(updated);
    }
    setLoading(false);
  }

  return (
    <div className="mx-4 mt-3">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm text-sm font-semibold text-[#1A1A1A]">
        <span>📋 รายการที่บันทึกไว้</span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="bg-white rounded-b-2xl shadow-sm -mt-2 pt-2 pb-3 px-4 space-y-2">
          {entries.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-3">ยังไม่มีรายการ</p>
          ) : (
            entries.map(entry => {
              const isEditing = editingId === entry.id;
              const timeLabel = getTimeLabel(entry.sessionName, entry.customStart, entry.customEnd);

              return (
                <div key={entry.id} className="border border-gray-100 rounded-xl p-3">
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-500 mb-1">
                        {entry.date} · {PLATFORM_LABELS[entry.platform]}
                        {timeLabel && ` · ${timeLabel}`}
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">฿</span>
                        <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)}
                          min="0" step="0.01"
                          className="w-full border-2 border-[#F5D400] rounded-xl pl-7 pr-4 py-2 text-lg font-bold focus:outline-none" />
                      </div>
                      <input value={editNotes} onChange={e => setEditNotes(e.target.value)}
                        placeholder="หมายเหตุ (ถ้ามี)"
                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#F5D400]" />
                      {error && <div className="text-red-500 text-xs">{error}</div>}
                      <div className="flex gap-2">
                        <button onClick={() => setEditingId(null)}
                          className="flex-1 py-2 rounded-xl border-2 border-gray-200 text-gray-500 text-sm">ยกเลิก</button>
                        <button onClick={() => submitEdit(entry.id)} disabled={loading}
                          className="flex-1 py-2 rounded-xl text-sm font-semibold text-[#1A1A1A] disabled:opacity-40"
                          style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}>
                          {loading ? "..." : "บันทึก"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-[#1A1A1A]">
                          ฿{entry.salesAmount.toLocaleString("th-TH")}
                        </div>
                        <div className="text-xs text-gray-500">
                          {entry.date} · {PLATFORM_LABELS[entry.platform]}
                          {timeLabel && ` · ${timeLabel}`}
                        </div>
                        {entry.notes && <div className="text-xs text-gray-400">📝 {entry.notes}</div>}
                      </div>
                      <button onClick={() => startEdit(entry)}
                        className="text-xs px-2 py-1 rounded-lg bg-[#FFF8CC] text-[#1A1A1A] font-medium ml-2 flex-shrink-0">
                        ✏️ แก้ไข
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
