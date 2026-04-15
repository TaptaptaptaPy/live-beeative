"use client";

import { createWorkSchedule } from "@/app/actions/schedule";
import { PLATFORM_LABELS } from "@/lib/utils";
import { useState } from "react";

type Employee = { id: string; name: string };
type Brand = { id: string; name: string; color: string };

export default function ScheduleForm({
  employees,
  brands,
  defaultDate,
}: {
  employees: Employee[];
  brands: Brand[];
  defaultDate: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await createWorkSchedule(new FormData(e.currentTarget));
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setOpen(false);
        (e.target as HTMLFormElement).reset();
      }, 1200);
    }
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 flex justify-between items-center text-left transition-all"
        style={open ? { background: "linear-gradient(135deg, #F5D400, #F5A882)" } : {}}
      >
        <span className="font-semibold text-[#1A1A1A]">➕ เพิ่มตารางไลฟ์</span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-3 border-t border-gray-100">
          {/* Employee */}
          <div className="pt-3">
            <label className="block text-xs font-medium text-gray-500 mb-1">พนักงาน *</label>
            <select
              name="userId"
              required
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm"
            >
              <option value="">เลือกพนักงาน</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">วันที่ *</label>
            <input
              type="date"
              name="date"
              required
              defaultValue={defaultDate}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm"
            />
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">เวลาเริ่ม *</label>
              <input
                type="time"
                name="startTime"
                required
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">เวลาสิ้นสุด *</label>
              <input
                type="time"
                name="endTime"
                required
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm"
              />
            </div>
          </div>

          {/* Platform */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Platform</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { key: "TIKTOK", emoji: "🎵" },
                { key: "SHOPEE", emoji: "🛒" },
                { key: "FACEBOOK", emoji: "📘" },
                { key: "OTHER", emoji: "📱" },
              ].map((p) => (
                <label key={p.key} className="cursor-pointer">
                  <input type="radio" name="platform" value={p.key} className="sr-only peer" />
                  <div className="flex flex-col items-center gap-0.5 py-2 rounded-xl border-2 border-gray-200 peer-checked:border-[#F5D400] peer-checked:bg-[#FFF8CC] text-center transition-all">
                    <span className="text-xl">{p.emoji}</span>
                    <span className="text-[10px] text-gray-500">{PLATFORM_LABELS[p.key]}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Brand */}
          {brands.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">แบรนด์</label>
              <select
                name="brandId"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm"
              >
                <option value="">ไม่ระบุแบรนด์</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">หมายเหตุ</label>
            <input
              name="note"
              placeholder="เช่น แฟลชเซล, ของใหม่"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm"
            />
          </div>

          {error && <div className="bg-red-50 text-red-600 rounded-xl p-3 text-sm">{error}</div>}
          {success && (
            <div className="bg-green-50 text-green-600 rounded-xl p-3 text-sm text-center">✅ เพิ่มแล้ว!</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl font-semibold disabled:opacity-40 text-[#1A1A1A] text-sm"
            style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}
          >
            {loading ? "กำลังบันทึก..." : "➕ เพิ่มตาราง"}
          </button>
        </form>
      )}
    </div>
  );
}
