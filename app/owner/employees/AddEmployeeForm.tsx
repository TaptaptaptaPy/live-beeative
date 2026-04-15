"use client";

import { createEmployee } from "@/app/actions/employees";
import { useState } from "react";

export default function AddEmployeeForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = await createEmployee(formData);
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
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 flex justify-between items-center text-left"
      >
        <span className="font-semibold text-gray-800">➕ เพิ่มพนักงานใหม่</span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-3 border-t border-gray-100">
          <div className="pt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อพนักงาน</label>
            <input
              name="name"
              required
              placeholder="เช่น สมชาย, น้องนุ่น"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PIN 4 หลัก</label>
            <input
              name="pin"
              type="number"
              required
              placeholder="1234"
              maxLength={4}
              pattern="\d{4}"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-xl font-mono tracking-widest"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Incentive (%)</label>
            <input
              name="incentiveRate"
              type="number"
              step="0.1"
              defaultValue="1"
              min="0"
              max="100"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <p className="text-xs text-gray-400 mt-1">เช่น 1 = 1% ของยอดขาย</p>
          </div>
          {error && (
            <div className="bg-red-50 text-red-600 rounded-xl p-3 text-sm">{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-indigo-500 text-white rounded-xl font-semibold disabled:opacity-40"
          >
            {loading ? "กำลังบันทึก..." : "เพิ่มพนักงาน"}
          </button>
        </form>
      )}
    </div>
  );
}
