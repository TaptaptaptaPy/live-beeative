"use client";

import { useState, useEffect } from "react";
import { createEntry } from "../actions/entries";
import { logout } from "../actions/auth";
import { todayString } from "@/lib/utils";

type LiveSession = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
};

const PLATFORMS = [
  { value: "TIKTOK", label: "TikTok", emoji: "🎵", color: "bg-black text-white" },
  { value: "SHOPEE", label: "Shopee", emoji: "🛒", color: "bg-orange-500 text-white" },
  { value: "FACEBOOK", label: "Facebook", emoji: "📘", color: "bg-blue-600 text-white" },
  { value: "OTHER", label: "อื่นๆ", emoji: "📱", color: "bg-gray-500 text-white" },
];

export default function EntryPage() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [date, setDate] = useState(todayString());
  const [sessionId, setSessionId] = useState("");
  const [isCustomTime, setIsCustomTime] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [platform, setPlatform] = useState("");
  const [salesAmount, setSalesAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then(setSessions)
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!platform) return setError("กรุณาเลือก Platform");
    if (!salesAmount || parseFloat(salesAmount) < 0) return setError("กรุณากรอกยอดขาย");
    if (!sessionId && !isCustomTime) return setError("กรุณาเลือกช่วงเวลา");

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("platform", platform);
    formData.append("salesAmount", salesAmount);
    formData.append("date", date);
    if (sessionId && !isCustomTime) formData.append("sessionId", sessionId);
    if (isCustomTime) {
      formData.append("customStart", customStart);
      formData.append("customEnd", customEnd);
    }
    if (notes) formData.append("notes", notes);

    const result = await createEntry(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  function resetForm() {
    setSessionId("");
    setIsCustomTime(false);
    setCustomStart("");
    setCustomEnd("");
    setPlatform("");
    setSalesAmount("");
    setNotes("");
    setDate(todayString());
    setError("");
    setSuccess(false);
  }

  if (success) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-green-400 to-emerald-600 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-sm w-full">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">บันทึกสำเร็จ!</h2>
          <p className="text-gray-500 mb-6">ยอดขายของคุณถูกบันทึกแล้ว</p>
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Platform:</span>
              <span className="font-semibold">{PLATFORMS.find(p => p.value === platform)?.label}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>ยอดขาย:</span>
              <span className="font-bold text-green-600 text-lg">
                ฿{parseFloat(salesAmount).toLocaleString("th-TH")}
              </span>
            </div>
          </div>
          <button
            onClick={resetForm}
            className="w-full h-12 bg-indigo-500 text-white rounded-2xl font-semibold mb-3"
          >
            กรอกยอดใหม่
          </button>
          <button
            onClick={() => logout()}
            className="w-full h-12 bg-gray-100 text-gray-600 rounded-2xl font-semibold"
          >
            ออกจากระบบ
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-indigo-600 text-white px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">บันทึกยอดขาย</h1>
          <p className="text-indigo-200 text-sm">กรอกข้อมูลให้ครบแล้วกด บันทึก</p>
        </div>
        <button
          onClick={() => logout()}
          className="text-indigo-200 text-sm border border-indigo-400 rounded-xl px-3 py-1"
        >
          ออก
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4 max-w-lg mx-auto pb-24">
        {/* Date */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="block text-gray-700 font-semibold mb-2">📅 วันที่</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* Session */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="block text-gray-700 font-semibold mb-3">⏰ ช่วงเวลาไลฟ์</label>
          <div className="grid grid-cols-1 gap-2">
            {sessions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => { setSessionId(s.id); setIsCustomTime(false); }}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  sessionId === s.id && !isCustomTime
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200"
                }`}
              >
                <div className="font-semibold text-gray-800">{s.name}</div>
                <div className="text-sm text-gray-500">{s.startTime} – {s.endTime} น.</div>
              </button>
            ))}
            <button
              type="button"
              onClick={() => { setIsCustomTime(true); setSessionId(""); }}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                isCustomTime ? "border-indigo-500 bg-indigo-50" : "border-gray-200"
              }`}
            >
              <div className="font-semibold text-gray-800">กำหนดเวลาเอง</div>
              <div className="text-sm text-gray-500">ระบุช่วงเวลาเอง</div>
            </button>
          </div>

          {isCustomTime && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-500 mb-1 block">เริ่ม</label>
                <input
                  type="time"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">สิ้นสุด</label>
                <input
                  type="time"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* Platform */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="block text-gray-700 font-semibold mb-3">📱 Platform</label>
          <div className="grid grid-cols-2 gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPlatform(p.value)}
                className={`p-3 rounded-xl border-2 flex items-center gap-2 transition-all ${
                  platform === p.value
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200"
                }`}
              >
                <span className="text-2xl">{p.emoji}</span>
                <span className="font-semibold text-gray-800">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sales Amount */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="block text-gray-700 font-semibold mb-2">💰 ยอดขาย (บาท)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">฿</span>
            <input
              type="number"
              inputMode="numeric"
              value={salesAmount}
              onChange={(e) => setSalesAmount(e.target.value)}
              placeholder="0"
              min="0"
              className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-4 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="block text-gray-700 font-semibold mb-2">📝 หมายเหตุ (ถ้ามี)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="เช่น ยอดรวม 2 แพลตฟอร์ม, มีโปรโมชั่น..."
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 rounded-2xl p-4 text-center font-medium">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-lg">
          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-indigo-600 text-white rounded-2xl text-lg font-bold disabled:opacity-40 active:scale-95 transition-all max-w-lg mx-auto block"
          >
            {loading ? "กำลังบันทึก..." : "✅ บันทึกยอดขาย"}
          </button>
        </div>
      </form>
    </main>
  );
}
