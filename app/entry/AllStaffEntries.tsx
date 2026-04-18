"use client";

import { useEffect, useState } from "react";
import { updateEntry, deleteEntry } from "@/app/actions/entries";

const PLATFORM_LABELS: Record<string, string> = {
  TIKTOK: "TikTok", SHOPEE: "Shopee", FACEBOOK: "Facebook", OTHER: "อื่นๆ",
};

type Entry = {
  id: string; date: string; platform: string; salesAmount: number;
  notes: string | null; createdAt: string;
  sessionName: string | null; customStart: string | null; customEnd: string | null;
  userId: string; userName: string;
};

function getTimeLabel(sessionName: string | null, start: string | null, end: string | null): string {
  if (start === "09:00" && end === "16:00") return "☀️ เช้า";
  if (start === "16:00" && (end === "00:00" || end === "24:00")) return "🌙 เย็น";
  if (start && end) return `⏰ ${start}–${end}`;
  if (sessionName) return `⏰ ${sessionName}`;
  return "";
}

export default function AllStaffEntries() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function refresh() {
    const data = await fetch("/api/staff-entries").then(r => r.json());
    setEntries(data);
  }

  useEffect(() => {
    if (open) refresh();
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
    else { setEditingId(null); await refresh(); }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    setDeletingId(id); setError("");
    const result = await deleteEntry(id);
    if (result?.error) setError(result.error);
    else await refresh();
    setDeletingId(null);
    setConfirmDeleteId(null);
  }

  return (
    <div className="mx-4 mt-3">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm text-sm font-semibold text-[#1A1A1A] border-l-4 border-orange-400">
        <span>👥 รายการของพนักงาน (48 ชม. ล่าสุด)</span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="bg-white rounded-b-2xl shadow-sm -mt-2 pt-2 pb-3 px-4 space-y-2">
          {error && !editingId && !confirmDeleteId && (
            <div className="text-red-500 text-xs text-center py-1">{error}</div>
          )}
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
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-semibold text-orange-500">{entry.userName}</span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs text-gray-500">
                          {entry.date} · {PLATFORM_LABELS[entry.platform]}
                          {timeLabel && ` · ${timeLabel}`}
                        </span>
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
                  ) : confirmDeleteId === entry.id ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-semibold text-orange-500">{entry.userName}</span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs text-gray-500">{entry.date}</span>
                      </div>
                      <div className="text-sm font-semibold text-red-600">
                        ยืนยันลบรายการ ฿{entry.salesAmount.toLocaleString("th-TH")} ?
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setConfirmDeleteId(null)}
                          className="flex-1 py-2 rounded-xl border-2 border-gray-200 text-gray-500 text-sm">ยกเลิก</button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          disabled={deletingId === entry.id}
                          className="flex-1 py-2 rounded-xl text-sm font-semibold text-white bg-red-500 active:bg-red-600 disabled:opacity-40">
                          {deletingId === entry.id ? "กำลังลบ..." : "🗑️ ลบ"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-orange-500">{entry.userName}</span>
                          <span className="text-sm font-bold text-[#1A1A1A]">
                            ฿{entry.salesAmount.toLocaleString("th-TH")}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {entry.date} · {PLATFORM_LABELS[entry.platform]}
                          {timeLabel && ` · ${timeLabel}`}
                        </div>
                        {entry.notes && <div className="text-xs text-gray-400">📝 {entry.notes}</div>}
                      </div>
                      <div className="flex gap-1.5 ml-2 flex-shrink-0">
                        <button onClick={() => { startEdit(entry); setConfirmDeleteId(null); }}
                          className="text-xs px-2 py-1 rounded-lg bg-[#FFF8CC] text-[#1A1A1A] font-medium">
                          ✏️ แก้ไข
                        </button>
                        <button onClick={() => { setConfirmDeleteId(entry.id); setError(""); setEditingId(null); }}
                          className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-500 font-medium">
                          🗑️
                        </button>
                      </div>
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
