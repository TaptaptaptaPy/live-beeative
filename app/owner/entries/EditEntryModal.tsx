"use client";

import { updateEntry } from "@/app/actions/entries";
import { useState } from "react";
import { PLATFORM_LABELS } from "@/lib/utils";

type Entry = {
  id: string;
  salesAmount: number;
  notes: string | null;
  platform: string;
  date: string;
  userName: string;
};

export default function EditEntryModal({ entry, onClose }: { entry: Entry; onClose: () => void }) {
  const [salesAmount, setSalesAmount] = useState(String(entry.salesAmount));
  const [notes, setNotes] = useState(entry.notes || "");
  const [platform, setPlatform] = useState(entry.platform);
  const [date, setDate] = useState(entry.date);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const fd = new FormData();
    fd.append("id", entry.id);
    fd.append("salesAmount", salesAmount);
    fd.append("notes", notes);
    fd.append("platform", platform);
    fd.append("date", date);
    const result = await updateEntry(fd);
    if (result?.error) setError(result.error);
    else onClose();
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="p-4 border-b border-gray-100"
          style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}>
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-[#1A1A1A]">✏️ แก้ไขรายการ</h2>
            <button onClick={onClose} className="text-[#1A1A1A]/60 text-xl leading-none">×</button>
          </div>
          <p className="text-xs text-[#1A1A1A]/70 mt-0.5">{entry.userName}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วันที่</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#F5D400] text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(PLATFORM_LABELS).map(([k, v]) => (
                <label key={k} className={`p-2 rounded-xl border-2 cursor-pointer text-sm text-center transition-all ${
                  platform === k ? "border-[#F5D400] bg-[#FFF8CC]" : "border-gray-200"
                }`}>
                  <input type="radio" value={k} checked={platform === k}
                    onChange={() => setPlatform(k)} className="sr-only" />
                  {v}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ยอดขาย (฿)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">฿</span>
              <input type="number" value={salesAmount} onChange={e => setSalesAmount(e.target.value)}
                min="0" step="0.01"
                className="w-full border-2 border-gray-200 rounded-xl pl-7 pr-4 py-2.5 text-lg font-bold focus:outline-none focus:border-[#F5D400]" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
            <input value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="ไม่มีหมายเหตุ"
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#F5D400] text-sm" />
          </div>

          {error && <div className="bg-red-50 text-red-600 rounded-xl p-3 text-sm">{error}</div>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 h-11 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold">
              ยกเลิก
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 h-11 rounded-xl font-semibold disabled:opacity-40 text-[#1A1A1A] text-sm"
              style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}>
              {loading ? "กำลังบันทึก..." : "💾 บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
