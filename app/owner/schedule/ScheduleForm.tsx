"use client";

import { createWorkSchedule } from "@/app/actions/schedule";
import { useState } from "react";

type Employee = { id: string; name: string };

export default function ScheduleForm({ employees, defaultWeek }: { employees: Employee[]; defaultWeek: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setError("");
    const result = await createWorkSchedule(new FormData(e.currentTarget));
    if (result?.error) setError(result.error);
    else { setSuccess(true); setTimeout(() => { setSuccess(false); setOpen(false); (e.target as HTMLFormElement).reset(); }, 1500); }
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full p-4 flex justify-between items-center text-left"
        style={open ? { background: "linear-gradient(135deg, #F5D400, #F5A882)" } : {}}>
        <span className="font-semibold text-[#1A1A1A]">➕ เพิ่มตารางไลฟ์</span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-3 border-t border-gray-100">
          <div className="pt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">พนักงาน</label>
            <select name="userId" required
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm">
              <option value="">เลือกพนักงาน</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วันที่</label>
            <input type="date" name="date" required defaultValue={defaultWeek}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เวลาเริ่ม</label>
              <input type="time" name="startTime" required
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เวลาสิ้นสุด</label>
              <input type="time" name="endTime" required
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ <span className="text-gray-400 font-normal">(ถ้ามี)</span></label>
            <input name="note" placeholder="เช่น ไลฟ์ TikTok, แฟลชเซล"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm" />
          </div>
          {error && <div className="bg-red-50 text-red-600 rounded-xl p-3 text-sm">{error}</div>}
          {success && <div className="bg-green-50 text-green-600 rounded-xl p-3 text-sm text-center">✅ เพิ่มแล้ว!</div>}
          <button type="submit" disabled={loading}
            className="w-full h-11 rounded-xl font-semibold disabled:opacity-40 text-[#1A1A1A] text-sm"
            style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}>
            {loading ? "กำลังบันทึก..." : "➕ เพิ่มตาราง"}
          </button>
        </form>
      )}
    </div>
  );
}
