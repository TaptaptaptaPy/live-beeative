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

function canEdit(createdAt: string) {
  return Date.now() - new Date(createdAt).getTime() <= 24 * 60 * 60 * 1000;
}

function timeLeft(createdAt: string) {
  const msLeft = 24 * 60 * 60 * 1000 - (Date.now() - new Date(createdAt).getTime());
  if (msLeft <= 0) return null;
  const h = Math.floor(msLeft / 3600000);
  const m = Math.floor((msLeft % 3600000) / 60000);
  return `${h}ชม. ${m}น.`;
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
      // Refresh list
      const updated = await fetch("/api/my-entries").then(r => r.json());
      setEntries(updated);
    }
    setLoading(false);
  }

  return (
    <div className="mx-4 mt-3">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm text-sm font-semibold text-[#1A1A1A]">
        <span>📋 รายการที่บันทึกไปล่าสุด</span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="bg-white rounded-b-2xl shadow-sm -mt-2 pt-2 pb-3 px-4 space-y-2">
          {entries.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-3">ยังไม่มีรายการในช่วง 48 ชั่วโมงที่ผ่านมา</p>
          ) : (
            entries.map(entry => {
              const editable = canEdit(entry.createdAt);
              const remaining = editable ? timeLeft(entry.createdAt) : null;
              const isEditing = editingId === entry.id;

              return (
                <div key={entry.id} className={`border rounded-xl p-3 ${editable ? "border-[#F5D400]" : "border-gray-100"}`}>
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-500 mb-1">
                        {entry.date} · {PLATFORM_LABELS[entry.platform]}
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
                          {entry.date} · {PLATFORM_LABELS[entry.platform]} ·{" "}
                          {entry.sessionName || (entry.customStart ? `${entry.customStart}–${entry.customEnd}` : "กำหนดเอง")}
                        </div>
                        {entry.notes && <div className="text-xs text-gray-400">📝 {entry.notes}</div>}
                      </div>
                      {editable ? (
                        <div className="text-right flex-shrink-0 ml-2">
                          <button onClick={() => startEdit(entry)}
                            className="text-xs px-2 py-1 rounded-lg bg-[#FFF8CC] text-[#1A1A1A] font-medium">
                            ✏️ แก้ไข
                          </button>
                          <div className="text-xs text-orange-400 mt-0.5">เหลือ {remaining}</div>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-300 ml-2">หมดเวลาแก้ไข</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Non-editable notice */}
          <p className="text-xs text-gray-400 text-center pt-1">
            ถ้าต้องการแก้ไขหลัง 24 ชั่วโมง กรุณาติดต่อเจ้าของช่อง
          </p>
        </div>
      )}
    </div>
  );
}
