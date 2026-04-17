"use client";

import { useState } from "react";

function thisMonthRange(): { start: string; end: string } {
  const today = new Date();
  const start = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  const end = today.toISOString().slice(0, 10);
  return { start, end };
}

export default function DailyExportButton() {
  const { start: defaultStart, end: defaultEnd } = thisMonthRange();
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleExport() {
    if (!startDate || !endDate) return setError("กรุณาเลือกช่วงวันที่");
    if (startDate > endDate) return setError("วันเริ่มต้องไม่เกินวันสิ้นสุด");

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/export/daily-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "เกิดข้อผิดพลาด");
        return;
      }

      // Trigger download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `LiveReport_${startDate}_${endDate}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("เชื่อมต่อไม่ได้ กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  // Quick range presets
  function setPreset(preset: "thisMonth" | "lastMonth" | "thisWeek" | "last7") {
    const today = new Date();
    if (preset === "thisMonth") {
      const start = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
      setStartDate(start);
      setEndDate(today.toISOString().slice(0, 10));
    } else if (preset === "lastMonth") {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last  = new Date(today.getFullYear(), today.getMonth(), 0);
      setStartDate(first.toISOString().slice(0, 10));
      setEndDate(last.toISOString().slice(0, 10));
    } else if (preset === "thisWeek") {
      const day = today.getDay();
      const mon = new Date(today);
      mon.setDate(today.getDate() - ((day + 6) % 7));
      setStartDate(mon.toISOString().slice(0, 10));
      setEndDate(today.toISOString().slice(0, 10));
    } else if (preset === "last7") {
      const from = new Date(today);
      from.setDate(today.getDate() - 6);
      setStartDate(from.toISOString().slice(0, 10));
      setEndDate(today.toISOString().slice(0, 10));
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100"
        style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}>
        <h2 className="font-bold text-[#1A1A1A]">📊 Export รายงานรายวัน (.xlsx)</h2>
        <p className="text-xs text-[#1A1A1A]/70 mt-0.5">
          แยกยอดตามช่วงเวลา: เช้า / เย็น / อื่นๆ — พร้อมชื่อคนลงและยอดขาย
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Quick presets */}
        <div>
          <label className="block text-xs text-gray-500 mb-2 font-medium">ช่วงเวลาด่วน</label>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: "thisMonth", label: "เดือนนี้" },
              { key: "lastMonth", label: "เดือนที่แล้ว" },
              { key: "thisWeek",  label: "สัปดาห์นี้" },
              { key: "last7",     label: "7 วันล่าสุด" },
            ].map(p => (
              <button key={p.key} type="button"
                onClick={() => setPreset(p.key as "thisMonth" | "lastMonth" | "thisWeek" | "last7")}
                className="px-3 py-1.5 text-xs rounded-xl border-2 border-gray-200 hover:border-[#F5D400] hover:bg-[#FFF8CC] transition-all font-medium">
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date pickers */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">วันที่เริ่ม</label>
            <input type="date" value={startDate} max={endDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#F5D400]"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">วันที่สิ้นสุด</label>
            <input type="date" value={endDate} min={startDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#F5D400]"
            />
          </div>
        </div>

        {/* Preview of columns */}
        <div className="bg-gray-50 rounded-xl p-3 overflow-x-auto">
          <p className="text-xs text-gray-400 mb-2 font-medium">Format ที่ได้</p>
          <table className="text-[10px] border-collapse w-full min-w-[500px]">
            <thead>
              <tr>
                <th className="border border-gray-300 px-2 py-1 bg-[#FFF8CC] text-center" rowSpan={2}>วันที่</th>
                <th className="border border-gray-300 px-2 py-1 bg-blue-50 text-center text-blue-700" colSpan={2}>☀️ เช้า</th>
                <th className="border border-gray-300 px-2 py-1 bg-purple-50 text-center text-purple-700" colSpan={2}>🌙 เย็น</th>
                <th className="border border-gray-300 px-2 py-1 bg-orange-50 text-center text-orange-700" colSpan={3}>⚙️ อื่นๆ / กำหนดเอง</th>
              </tr>
              <tr>
                <th className="border border-gray-300 px-2 py-1 bg-blue-50 text-blue-600">ชื่อคนลง</th>
                <th className="border border-gray-300 px-2 py-1 bg-blue-50 text-blue-600">ยอด</th>
                <th className="border border-gray-300 px-2 py-1 bg-purple-50 text-purple-600">ชื่อคนลง</th>
                <th className="border border-gray-300 px-2 py-1 bg-purple-50 text-purple-600">ยอด</th>
                <th className="border border-gray-300 px-2 py-1 bg-orange-50 text-orange-600">ชื่อคนลง</th>
                <th className="border border-gray-300 px-2 py-1 bg-orange-50 text-orange-600">ช่วงเวลา</th>
                <th className="border border-gray-300 px-2 py-1 bg-orange-50 text-orange-600">ยอด</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-gray-500">
                <td className="border border-gray-200 px-2 py-1 text-center">2026-04-17</td>
                <td className="border border-gray-200 px-2 py-1 text-center">Bee</td>
                <td className="border border-gray-200 px-2 py-1 text-center">50,000</td>
                <td className="border border-gray-200 px-2 py-1 text-center">Bee</td>
                <td className="border border-gray-200 px-2 py-1 text-center">30,000</td>
                <td className="border border-gray-200 px-2 py-1 text-center text-gray-400">—</td>
                <td className="border border-gray-200 px-2 py-1 text-center text-gray-400">—</td>
                <td className="border border-gray-200 px-2 py-1 text-center text-gray-400">—</td>
              </tr>
            </tbody>
          </table>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 rounded-xl p-3 text-sm text-center">{error}</div>
        )}

        <button
          onClick={handleExport}
          disabled={loading}
          className="w-full h-12 rounded-2xl font-bold text-[#1A1A1A] text-sm disabled:opacity-40 active:scale-95 transition-all flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              กำลังสร้างไฟล์...
            </>
          ) : (
            <>⬇️ Download Excel (.xlsx)</>
          )}
        </button>

        <p className="text-xs text-gray-400 text-center">
          ถ้าในช่วงนั้นไม่มียอด วันที่นั้นจะแสดงเป็นแถวเปล่า
        </p>
      </div>
    </div>
  );
}
