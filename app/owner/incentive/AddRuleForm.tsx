"use client";

import { createIncentiveRule } from "@/app/actions/incentive";
import { useState } from "react";

const RULE_TYPES = [
  { value: "PERCENTAGE", label: "% ของยอดขาย" },
  { value: "FIXED", label: "จำนวนเงินคงที่" },
  { value: "BONUS", label: "โบนัสพิเศษ" },
];

export default function AddRuleForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("PERCENTAGE");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = await createIncentiveRule(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setOpen(false);
      (e.target as HTMLFormElement).reset();
      setType("PERCENTAGE");
    }
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 flex justify-between items-center text-left"
      >
        <span className="font-semibold text-gray-800">➕ เพิ่มกฎ Incentive</span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อกฎ</label>
            <input
              name="name"
              required
              placeholder="เช่น ค่า Incentive ปกติ"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
            <input
              name="description"
              placeholder="อธิบายกฎเพิ่มเติม (ถ้ามี)"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ประเภท</label>
            <select
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {RULE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {type === "PERCENTAGE" ? "เปอร์เซ็นต์ (%)" : "จำนวนเงิน (บาท)"}
            </label>
            <input
              name="value"
              type="number"
              step="0.1"
              min="0"
              required
              placeholder={type === "PERCENTAGE" ? "1.5" : "500"}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ยอดขั้นต่ำ (บาท)</label>
              <input
                name="minSales"
                type="number"
                min="0"
                placeholder="ไม่กำหนด"
                className="w-full border border-gray-200 rounded-xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ยอดสูงสุด (บาท)</label>
              <input
                name="maxSales"
                type="number"
                min="0"
                placeholder="ไม่กำหนด"
                className="w-full border border-gray-200 rounded-xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              />
            </div>
          </div>
          {error && (
            <div className="bg-red-50 text-red-600 rounded-xl p-3 text-sm">{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-indigo-500 text-white rounded-xl font-semibold disabled:opacity-40"
          >
            {loading ? "กำลังบันทึก..." : "บันทึกกฎ"}
          </button>
        </form>
      )}
    </div>
  );
}
