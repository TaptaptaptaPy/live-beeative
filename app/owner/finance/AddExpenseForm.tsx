"use client";

import { createExpense } from "@/app/actions/expenses";
import { EXPENSE_CATEGORIES } from "@/lib/expense-utils";
import { todayString } from "@/lib/utils";
import { useState } from "react";

export default function AddExpenseForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = await createExpense(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setOpen(false);
      (e.target as HTMLFormElement).reset();
    }
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full p-4 flex justify-between items-center text-left">
        <span className="font-semibold text-[#1A1A1A]">➕ เพิ่มรายจ่าย</span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อรายจ่าย</label>
              <input name="name" required placeholder="เช่น เงินเดือนเดือนมิ.ย."
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนเงิน (บาท)</label>
              <input name="amount" type="number" min="0" step="0.01" required placeholder="0"
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่</label>
              <input name="date" type="date" defaultValue={todayString()} required
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">หมวดหมู่</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(EXPENSE_CATEGORIES).map(([key, { label, emoji }]) => (
                <label key={key}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl border-2 border-gray-200 cursor-pointer has-[:checked]:border-[#F5D400] has-[:checked]:bg-[#FFF8CC] transition-all text-center">
                  <input type="radio" name="category" value={key} className="sr-only" required />
                  <span className="text-xl">{emoji}</span>
                  <span className="text-xs text-gray-600 leading-tight">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
            <input name="notes" placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="isRecurring" value="true"
              className="w-4 h-4 rounded accent-[#F5D400]"
            />
            <span className="text-sm text-gray-600">🔄 รายจ่ายประจำ (เกิดซ้ำทุกเดือน)</span>
          </label>

          {error && <div className="bg-red-50 text-red-600 rounded-xl p-3 text-sm">{error}</div>}

          <button type="submit" disabled={loading}
            className="w-full h-12 rounded-xl font-semibold disabled:opacity-40 text-[#1A1A1A]"
            style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}
          >
            {loading ? "กำลังบันทึก..." : "บันทึกรายจ่าย"}
          </button>
        </form>
      )}
    </div>
  );
}
