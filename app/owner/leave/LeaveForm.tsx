"use client";

import { upsertLeaveEntitlement, createLeaveUsed } from "@/app/actions/leave";
import { useState } from "react";

const LEAVE_TYPES = [
  { value: "SICK",     label: "🤒 ลาป่วย" },
  { value: "PERSONAL", label: "📋 ลากิจ" },
  { value: "ANNUAL",   label: "🏖️ ลาพักร้อน" },
  { value: "OTHER",    label: "📌 ลาอื่นๆ" },
];

type Props = { employee: { id: string; name: string }; year: number };

export default function LeaveForm({ employee, year }: Props) {
  const [mode, setMode] = useState<"entitlement" | "used">("entitlement");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(action: (fd: FormData) => Promise<{ error?: string; success?: boolean }>, fd: FormData) {
    setLoading(true); setMsg("");
    const r = await action(fd);
    setMsg(r?.error ? `❌ ${r.error}` : "✅ บันทึกแล้ว");
    setTimeout(() => setMsg(""), 3000);
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100"
        style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}>
        <h2 className="font-bold text-[#1A1A1A]">✏️ จัดการวันลา — {employee.name}</h2>
      </div>

      {/* Mode tabs */}
      <div className="flex border-b border-gray-100">
        {[
          { key: "entitlement", label: "ตั้งสิทธิ์ลา" },
          { key: "used", label: "บันทึกการลา" },
        ].map(m => (
          <button key={m.key} onClick={() => setMode(m.key as "entitlement" | "used")}
            className={`flex-1 py-2.5 text-sm font-semibold transition-all ${mode === m.key ? "text-[#1A1A1A] border-b-2 border-[#F5D400]" : "text-gray-400"}`}>
            {m.label}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3">
        {msg && <div className="text-sm text-center rounded-xl p-2 bg-gray-50">{msg}</div>}

        {mode === "entitlement" && (
          <>
            <p className="text-xs text-gray-500">ตั้งจำนวนวันลาที่พนักงานได้รับสิทธิ์ต่อปี</p>
            <div className="space-y-2">
              {LEAVE_TYPES.map(lt => (
                <div key={lt.value} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 w-28">{lt.label}</span>
                  <input id={`ent-${lt.value}`} type="number" min="0" step="0.5" placeholder="วัน"
                    className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#F5D400] text-sm" />
                  <button disabled={loading} onClick={() => {
                    const fd = new FormData();
                    fd.append("userId", employee.id);
                    fd.append("leaveType", lt.value);
                    fd.append("year", String(year));
                    fd.append("totalDays", (document.getElementById(`ent-${lt.value}`) as HTMLInputElement).value);
                    submit(upsertLeaveEntitlement, fd);
                  }} className="px-3 py-2 rounded-xl text-xs font-semibold text-[#1A1A1A]"
                    style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}>
                    ตั้ง
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {mode === "used" && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            fd.append("userId", employee.id);
            await submit(createLeaveUsed, fd);
            (e.target as HTMLFormElement).reset();
          }} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทการลา</label>
              <select name="leaveType" required
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm">
                {LEAVE_TYPES.map(lt => <option key={lt.value} value={lt.value}>{lt.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วันที่ลา</label>
                <input type="date" name="date" required
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">จำนวน (วัน)</label>
                <input type="number" name="days" min="0.5" step="0.5" defaultValue="1" required
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
              <input name="notes" placeholder="เช่น ใบแพทย์, ธุระส่วนตัว"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full h-11 rounded-xl font-semibold disabled:opacity-40 text-[#1A1A1A] text-sm"
              style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}>
              {loading ? "กำลังบันทึก..." : "💾 บันทึกการลา"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
