"use client";

import { upsertCampaignTarget } from "@/app/actions/targets";
import { useState } from "react";

export default function CampaignForm() {
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const fd = new FormData(e.currentTarget);
    const r = await upsertCampaignTarget(fd);
    if (r?.error) {
      setMsg(`❌ ${r.error}`);
    } else {
      setMsg("✅ บันทึกแล้ว");
      (e.target as HTMLFormElement).reset();
      setTimeout(() => { setMsg(""); setOpen(false); }, 2000);
    }
    setLoading(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 rounded-2xl text-sm font-semibold text-[#1A1A1A] border-2 border-dashed border-[#F5D400] hover:bg-[#FFF8CC] transition-all"
      >
        + เพิ่มแคมเปญใหม่
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100"
        style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}>
        <h2 className="font-bold text-[#1A1A1A]">✏️ เพิ่มเป้าแคมเปญ / เทศกาล</h2>
      </div>
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {msg && <div className="text-sm text-center rounded-xl p-2 bg-gray-50">{msg}</div>}

        <div>
          <label className="block text-sm font-semibold text-[#1A1A1A] mb-1">ชื่อแคมเปญ</label>
          <input
            name="name"
            type="text"
            required
            placeholder="เช่น 11.11, สงกรานต์, Double Day"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm"
          />
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-[#1A1A1A] mb-1">วันเริ่ม</label>
            <input
              name="startDate"
              type="date"
              required
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-[#1A1A1A] mb-1">วันสิ้นสุด</label>
            <input
              name="endDate"
              type="date"
              required
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#1A1A1A] mb-1">เป้ายอดขาย (฿)</label>
          <input
            name="amount"
            type="number"
            min="0"
            required
            placeholder="เช่น 200000"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#1A1A1A] mb-1">หมายเหตุ (ไม่บังคับ)</label>
          <input
            name="notes"
            type="text"
            placeholder="เช่น โปรโมชั่น Flash Sale"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-500 border-2 border-gray-200 hover:bg-gray-50 transition-all"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-[#1A1A1A] transition-all"
            style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}
          >
            {loading ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </form>
    </div>
  );
}
