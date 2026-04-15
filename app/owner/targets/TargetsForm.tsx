"use client";

import { upsertSalesTarget, upsertExpenseBudget } from "@/app/actions/targets";
import { useState } from "react";

type Props = {
  month: string;
  employees: { id: string; name: string }[];
  overallTarget: number | null;
  empTargets: Record<string, number>;
  expenseBudget: number | null;
};

export default function TargetsForm({ month, employees, overallTarget, empTargets, expenseBudget }: Props) {
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
        <h2 className="font-bold text-[#1A1A1A]">✏️ ตั้งค่าเป้า — {month}</h2>
      </div>
      <div className="p-4 space-y-4">
        {msg && <div className="text-sm text-center rounded-xl p-2 bg-gray-50">{msg}</div>}

        {/* Overall target */}
        <div>
          <label className="block text-sm font-semibold text-[#1A1A1A] mb-1">🏆 เป้ายอดรวมทีม (฿)</label>
          <div className="flex gap-2">
            <input id="overallAmt" type="number" min="0" defaultValue={overallTarget ?? ""} placeholder="เช่น 500000"
              className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm" />
            <button disabled={loading} onClick={() => {
              const fd = new FormData();
              fd.append("month", month);
              fd.append("userId", "");
              fd.append("amount", (document.getElementById("overallAmt") as HTMLInputElement).value);
              submit(upsertSalesTarget, fd);
            }} className="px-4 py-2 rounded-xl text-sm font-semibold text-[#1A1A1A]"
              style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}>
              บันทึก
            </button>
          </div>
        </div>

        {/* Expense budget */}
        <div>
          <label className="block text-sm font-semibold text-[#1A1A1A] mb-1">💸 งบรายจ่าย (฿)</label>
          <div className="flex gap-2">
            <input id="budgetAmt" type="number" min="0" defaultValue={expenseBudget ?? ""} placeholder="เช่น 100000"
              className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm" />
            <button disabled={loading} onClick={() => {
              const fd = new FormData();
              fd.append("month", month);
              fd.append("amount", (document.getElementById("budgetAmt") as HTMLInputElement).value);
              submit(upsertExpenseBudget, fd);
            }} className="px-4 py-2 rounded-xl text-sm font-semibold text-[#1A1A1A]"
              style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}>
              บันทึก
            </button>
          </div>
        </div>

        {/* Per-employee targets */}
        <div>
          <label className="block text-sm font-semibold text-[#1A1A1A] mb-2">👤 เป้าแต่ละคน (฿)</label>
          <div className="space-y-2">
            {employees.map(emp => (
              <div key={emp.id} className="flex items-center gap-2">
                <span className="text-sm text-gray-700 w-24 truncate">{emp.name}</span>
                <input id={`emp-${emp.id}`} type="number" min="0" defaultValue={empTargets[emp.id] ?? ""} placeholder="ไม่ตั้ง"
                  className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#F5D400] text-sm" />
                <button disabled={loading} onClick={() => {
                  const val = (document.getElementById(`emp-${emp.id}`) as HTMLInputElement).value;
                  if (!val) return;
                  const fd = new FormData();
                  fd.append("month", month);
                  fd.append("userId", emp.id);
                  fd.append("amount", val);
                  submit(upsertSalesTarget, fd);
                }} className="px-3 py-2 rounded-xl text-xs font-semibold text-[#1A1A1A]"
                  style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}>
                  ตั้ง
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
