export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import LeaveForm from "./LeaveForm";
import ToggleLeaveButton from "./ToggleLeaveButton";

const LEAVE_LABELS: Record<string, { label: string; emoji: string }> = {
  SICK:     { label: "ลาป่วย",      emoji: "🤒" },
  PERSONAL: { label: "ลากิจ",       emoji: "📋" },
  ANNUAL:   { label: "ลาพักร้อน",   emoji: "🏖️" },
  OTHER:    { label: "ลาอื่นๆ",     emoji: "📌" },
};

export default async function LeavePage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const params = await searchParams;
  const selectedUserId = params.userId || "";
  const year = new Date().getFullYear();

  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE", isActive: true },
    orderBy: { name: "asc" },
    include: {
      leaveEntitlements: { where: { year } },
      leaveUsed: { orderBy: { date: "desc" } },
    },
  });

  const selectedEmp = selectedUserId ? employees.find(e => e.id === selectedUserId) : employees[0];

  // Compute used per type for selected employee
  const usedByType: Record<string, number> = {};
  if (selectedEmp) {
    for (const l of selectedEmp.leaveUsed) {
      usedByType[l.leaveType] = (usedByType[l.leaveType] || 0) + l.days;
    }
  }

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[#1A1A1A] pt-2">🏖️ ระบบวันลา</h1>

      {/* Employee tabs */}
      <div className="flex gap-2 flex-wrap">
        {employees.map(e => (
          <a key={e.id} href={`/owner/leave?userId=${e.id}`}
            className={`text-sm px-3 py-1.5 rounded-xl border-2 font-medium transition-all flex items-center gap-2 ${
              (selectedEmp?.id === e.id) ? "border-[#F5D400] bg-[#FFF8CC]" : "border-gray-200 text-gray-600"
            }`}>
            {e.profileImage ? (
              <img src={e.profileImage} alt={e.name} className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-[#FFF8CC] flex items-center justify-center text-xs font-bold">{e.name.slice(0,1)}</div>
            )}
            {e.name}
            {!e.showLeave && <span className="text-xs text-gray-400">🙈</span>}
          </a>
        ))}
      </div>

      {selectedEmp && (
        <>
          {/* Visibility toggle */}
          <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <div className="font-semibold text-[#1A1A1A]">{selectedEmp.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {selectedEmp.showLeave ? "👁️ พนักงานเห็นวันลาอยู่" : "🙈 พนักงานยังไม่เห็นวันลา"}
              </div>
            </div>
            <ToggleLeaveButton userId={selectedEmp.id} showLeave={selectedEmp.showLeave} />
          </div>

          {/* Leave entitlement summary */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-bold text-[#1A1A1A] mb-3">สิทธิ์ลาปี {year}</h2>
            <div className="space-y-3">
              {Object.entries(LEAVE_LABELS).map(([type, meta]) => {
                const ent = selectedEmp.leaveEntitlements.find(e => e.leaveType === type);
                const used = usedByType[type] || 0;
                const total = ent?.totalDays ?? 0;
                const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
                return (
                  <div key={type}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-[#1A1A1A]">{meta.emoji} {meta.label}</span>
                      <span className="text-gray-500">{used} / {total} วัน {total === 0 && <span className="text-gray-300">(ยังไม่ตั้ง)</span>}</span>
                    </div>
                    {total > 0 && (
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: pct >= 100 ? "#ef4444" : "linear-gradient(90deg, #F5D400, #F5A882)" }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leave history */}
          {selectedEmp.leaveUsed.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="font-bold text-[#1A1A1A] mb-3">📋 ประวัติการลา</h2>
              <div className="space-y-2">
                {selectedEmp.leaveUsed.slice(0, 20).map(l => (
                  <div key={l.id} className="flex items-center justify-between text-sm border-b border-gray-50 pb-2">
                    <div>
                      <span className="font-medium text-[#1A1A1A]">{LEAVE_LABELS[l.leaveType]?.emoji} {LEAVE_LABELS[l.leaveType]?.label}</span>
                      <span className="text-gray-400 ml-2">{l.date}</span>
                      {l.notes && <span className="text-gray-400 ml-1">· {l.notes}</span>}
                    </div>
                    <span className="font-semibold text-[#1A1A1A]">{l.days} วัน</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Forms */}
          <LeaveForm employee={{ id: selectedEmp.id, name: selectedEmp.name }} year={year} />
        </>
      )}
    </div>
  );
}
