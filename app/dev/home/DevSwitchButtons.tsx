"use client";

import { devSwitchToEmployee } from "@/app/actions/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Employee = { id: string; name: string; profileImage: string | null };

export default function DevSwitchButtons({ employees }: { employees: Employee[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function switchTo(emp: Employee) {
    setLoading(emp.id);
    const result = await devSwitchToEmployee(emp.id);
    if (result?.error) {
      alert(result.error);
      setLoading(null);
    } else {
      router.push("/entry");
    }
  }

  return (
    <div className="space-y-2">
      {/* Toggle employee list */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full bg-[#111] hover:bg-[#222] border border-[#333] rounded-xl px-4 py-3 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">👤</span>
          <div className="text-left">
            <div className="text-white text-sm font-medium">Staff View — เลือกพนักงาน</div>
            <div className="text-gray-500 text-xs">/entry — impersonate เพื่อดูหน้า staff</div>
          </div>
        </div>
        <span className="text-gray-600 group-hover:text-gray-400">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="ml-3 space-y-1.5 border-l-2 border-[#2a2a2a] pl-3">
          {employees.map((emp) => (
            <button
              key={emp.id}
              onClick={() => switchTo(emp)}
              disabled={loading === emp.id}
              className="flex items-center gap-3 w-full bg-[#0f0f0f] hover:bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2.5 transition-colors text-left disabled:opacity-50"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border border-[#333] flex-shrink-0">
                {emp.profileImage ? (
                  <img src={emp.profileImage} alt={emp.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#2a2a2a] flex items-center justify-center text-sm font-bold text-white">
                    {emp.name.slice(0, 1)}
                  </div>
                )}
              </div>
              <span className="text-white text-sm flex-1">{emp.name}</span>
              <span className="text-gray-600 text-xs">
                {loading === emp.id ? "กำลังสลับ..." : "เข้าดู →"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
