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
    const result = await createEmployee(new FormData(e.currentTarget));
    if (result?.error) setError(result.error);
    else { setOpen(false); (e.target as HTMLFormElement).reset(); }
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full p-4 flex justify-between items-center text-left"
        style={open ? { background: "linear-gradient(135deg, #F5D400, #F5A882)" } : {}}>
        <span className="font-semibold text-[#1A1A1A]">➕ เพิ่มพนักงานใหม่</span>
        <span className="text-[#1A1A1A]/60">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-3 border-t border-gray-100">
          <div className="pt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อพนักงาน *</label>
            <input name="name" required placeholder="เช่น สมชาย, น้องนุ่น"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PIN 4 หลัก <span className="text-gray-400 font-normal">(ไม่จำเป็น — พนักงานตั้งเองได้)</span></label>
            <input name="pin" type="password" inputMode="numeric" placeholder="ปล่อยว่างได้" maxLength={4}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm font-mono tracking-widest" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เงินเดือน (฿)</label>
              <input name="salary" type="number" min="0" defaultValue="0"
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Incentive (%)</label>
              <input name="incentiveRate" type="number" step="0.1" defaultValue="1" min="0" max="100"
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm" />
            </div>
          </div>
          {error && <div className="bg-red-50 text-red-600 rounded-xl p-3 text-sm">{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full h-11 rounded-xl font-semibold disabled:opacity-40 text-[#1A1A1A] text-sm"
            style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}>
            {loading ? "กำลังบันทึก..." : "เพิ่มพนักงาน"}
          </button>
        </form>
      )}
    </div>
  );
}
