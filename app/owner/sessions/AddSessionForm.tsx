"use client";

import { createLiveSession } from "@/app/actions/sessions";
import { useState } from "react";

export default function AddSessionForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = await createLiveSession(formData);
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
        <span className="font-semibold text-gray-800">➕ เพิ่มช่วงเวลาใหม่</span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อช่วงเวลา</label>
            <input
              name="name"
              required
              placeholder="เช่น ช่วงเช้า, ช่วงเย็น"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เวลาเริ่ม</label>
              <input
                name="startTime"
                type="time"
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เวลาสิ้นสุด</label>
              <input
                name="endTime"
                type="time"
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ลำดับ (sortOrder)</label>
            <input
              name="sortOrder"
              type="number"
              defaultValue="0"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          {error && (
            <div className="bg-red-50 text-red-600 rounded-xl p-3 text-sm">{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-indigo-500 text-white rounded-xl font-semibold disabled:opacity-40"
          >
            {loading ? "กำลังบันทึก..." : "เพิ่มช่วงเวลา"}
          </button>
        </form>
      )}
    </div>
  );
}
