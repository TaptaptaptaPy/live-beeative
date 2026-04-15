"use client";

import { createBulkEntry } from "@/app/actions/entries";
import { useState } from "react";

type Employee = { id: string; name: string };

const PERIOD_TYPES = [
  { value: "DAILY",   label: "รายวัน",       desc: "ยอดรวม 1 วัน" },
  { value: "WEEKLY",  label: "รายสัปดาห์",    desc: "ยอดรวม 7 วัน" },
  { value: "MONTHLY", label: "รายเดือน",      desc: "ยอดรวมทั้งเดือน" },
  { value: "YEARLY",  label: "รายปี",         desc: "ยอดรวมทั้งปี" },
  { value: "CUSTOM",  label: "กำหนดเอง",      desc: "เลือกช่วงวันเอง" },
];

const PLATFORMS = [
  { value: "",        label: "ทุก Platform" },
  { value: "TIKTOK",   label: "TikTok" },
  { value: "SHOPEE",   label: "Shopee" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "OTHER",    label: "อื่นๆ" },
];

export default function BulkEntryForm({ employees }: { employees: Employee[] }) {
  const [periodType, setPeriodType] = useState("MONTHLY");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function handlePeriodChange(type: string) {
    setPeriodType(type);
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    if (type === "DAILY") {
      const s = fmt(today); setStartDate(s); setEndDate(s);
    } else if (type === "WEEKLY") {
      const day = today.getDay();
      const mon = new Date(today); mon.setDate(today.getDate() - ((day + 6) % 7));
      setStartDate(fmt(mon)); setEndDate(fmt(today));
    } else if (type === "MONTHLY") {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(fmt(first)); setEndDate(fmt(today));
    } else if (type === "YEARLY") {
      const first = new Date(today.getFullYear(), 0, 1);
      setStartDate(fmt(first)); setEndDate(fmt(today));
    } else {
      setStartDate(""); setEndDate("");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setError("");
    const fd = new FormData(e.currentTarget);
    const result = await createBulkEntry(fd);
    if (result?.error) setError(result.error);
    else { setSuccess(true); setTimeout(() => setSuccess(false), 3000); (e.target as HTMLFormElement).reset(); }
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100"
        style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}>
        <h2 className="font-bold text-[#1A1A1A]">➕ เพิ่มยอดย้อนหลัง</h2>
        <p className="text-xs text-[#1A1A1A]/70 mt-0.5">เจ้าของสามารถลงยอดย้อนหลังได้ไม่จำกัด</p>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Period Type */}
        <div>
          <label className="block text-sm font-semibold text-[#1A1A1A] mb-2">ประเภทช่วงเวลา</label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {PERIOD_TYPES.map(p => (
              <label key={p.value}
                className={`flex flex-col items-center p-2 rounded-xl border-2 cursor-pointer transition-all text-center ${periodType === p.value ? "border-[#F5D400] bg-[#FFF8CC]" : "border-gray-200"}`}>
                <input type="radio" name="periodType" value={p.value} className="sr-only"
                  checked={periodType === p.value}
                  onChange={() => handlePeriodChange(p.value)} />
                <span className="text-xs font-semibold text-[#1A1A1A]">{p.label}</span>
                <span className="text-xs text-gray-400 mt-0.5 leading-tight">{p.desc}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วันที่เริ่ม</label>
            <input type="date" name="startDate" value={startDate}
              onChange={e => setStartDate(e.target.value)} required
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วันที่สิ้นสุด</label>
            <input type="date" name="endDate" value={endDate}
              onChange={e => setEndDate(e.target.value)} required
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm" />
          </div>
        </div>

        {/* Employee */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">พนักงาน</label>
          <select name="userId"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm">
            <option value="">ทุกพนักงาน (รวม)</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>

        {/* Platform */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
          <select name="platform"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm">
            {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>

        {/* Total Sales */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ยอดขายรวม (บาท)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">฿</span>
            <input type="number" name="totalSales" min="0" step="0.01" required placeholder="0"
              className="w-full border-2 border-gray-200 rounded-xl pl-8 pr-4 py-3 text-xl font-bold focus:outline-none focus:border-[#F5D400]" />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
          <input name="notes" placeholder="เช่น ยอดรวมก่อนมีระบบ ม.ค.-มี.ค. 67"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm" />
        </div>

        {error && <div className="bg-red-50 text-red-600 rounded-xl p-3 text-sm">{error}</div>}
        {success && <div className="bg-green-50 text-green-600 rounded-xl p-3 text-sm text-center">✅ บันทึกสำเร็จ!</div>}

        <button type="submit" disabled={loading}
          className="w-full h-12 rounded-xl font-bold disabled:opacity-40 text-[#1A1A1A]"
          style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}>
          {loading ? "กำลังบันทึก..." : "💾 บันทึกยอดย้อนหลัง"}
        </button>
      </form>
    </div>
  );
}
