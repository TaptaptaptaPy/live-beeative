export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EmployeeEditForm from "./EmployeeEditForm";
import Link from "next/link";

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [emp, totalEntries, totalSales, leaveEntitlements, leaveUsed] = await Promise.all([
    prisma.user.findUnique({ where: { id } }),
    prisma.timeEntry.count({ where: { userId: id } }),
    prisma.timeEntry.aggregate({ where: { userId: id }, _sum: { salesAmount: true } }),
    prisma.leaveEntitlement.findMany({
      where: { userId: id, year: new Date().getFullYear() },
    }),
    prisma.leaveUsed.findMany({
      where: { userId: id },
      orderBy: { date: "desc" },
      take: 20,
    }),
  ]);

  if (!emp || emp.role !== "EMPLOYEE") notFound();

  const grandTotal = totalSales._sum.salesAmount ?? 0;
  const incentiveEarned = grandTotal * (emp.incentiveRate / 100);

  const LEAVE_LABELS: Record<string, string> = {
    SICK: "ลาป่วย", PERSONAL: "ลากิจ", ANNUAL: "ลาพักร้อน", OTHER: "ลาอื่นๆ",
  };

  // summarize leave used per type
  const leaveUsedByType: Record<string, number> = {};
  for (const l of leaveUsed) {
    leaveUsedByType[l.leaveType] = (leaveUsedByType[l.leaveType] || 0) + l.days;
  }

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 pt-2">
        <Link href="/owner/employees" className="text-gray-400 text-2xl leading-none">‹</Link>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">รายละเอียดพนักงาน</h1>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[#F5D400] flex-shrink-0">
          {emp.profileImage ? (
            <img src={emp.profileImage} alt={emp.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[#FFF8CC] flex items-center justify-center text-3xl font-bold text-[#1A1A1A]">
              {emp.name.slice(0, 1)}
            </div>
          )}
        </div>
        <div>
          <div className="text-xl font-bold text-[#1A1A1A]">{emp.name}</div>
          <div className="text-sm text-gray-500 mt-1">
            {emp.isActive ? "✅ ใช้งานอยู่" : "⛔ ปิดการใช้งาน"} ·{" "}
            {emp.pinSet ? "🔒 ตั้ง PIN แล้ว" : "⚠️ ยังไม่ตั้ง PIN"}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
          <div className="text-xs text-gray-500 mb-1">รายการทั้งหมด</div>
          <div className="font-bold text-[#1A1A1A]">{totalEntries}</div>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
          <div className="text-xs text-gray-500 mb-1">ยอดรวม</div>
          <div className="font-bold text-green-600">฿{grandTotal.toLocaleString("th-TH", { maximumFractionDigits: 0 })}</div>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
          <div className="text-xs text-gray-500 mb-1">Incentive</div>
          <div className="font-bold text-[#F5A882]">฿{incentiveEarned.toLocaleString("th-TH", { maximumFractionDigits: 0 })}</div>
        </div>
      </div>

      {/* Edit form */}
      <EmployeeEditForm employee={{
        id: emp.id, name: emp.name, salary: emp.salary,
        incentiveRate: emp.incentiveRate, isActive: emp.isActive,
        pinSet: emp.pinSet, profileImage: emp.profileImage ?? "",
        showSalary: emp.showSalary,
      }} />

      {/* Leave summary */}
      {leaveEntitlements.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-bold text-[#1A1A1A] mb-3">🏖️ สิทธิ์วันลา ({new Date().getFullYear()})</h2>
          <div className="space-y-2">
            {leaveEntitlements.map((ent) => {
              const used = leaveUsedByType[ent.leaveType] || 0;
              const pct = Math.min((used / ent.totalDays) * 100, 100);
              return (
                <div key={ent.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#1A1A1A] font-medium">{LEAVE_LABELS[ent.leaveType]}</span>
                    <span className="text-gray-500">{used} / {ent.totalDays} วัน</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: pct >= 100 ? "#ef4444" : "linear-gradient(90deg, #F5D400, #F5A882)" }} />
                  </div>
                </div>
              );
            })}
          </div>
          <Link href="/owner/leave" className="block text-center text-xs text-[#F5A882] mt-3">จัดการสิทธิ์วันลา →</Link>
        </div>
      )}
    </div>
  );
}
