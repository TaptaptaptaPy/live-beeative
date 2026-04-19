export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AddEmployeeForm from "./AddEmployeeForm";

export default async function EmployeesPage() {
  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE", deletedAt: null },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto animate-fade-in">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white pt-2">👥 จัดการพนักงาน</h1>

      <AddEmployeeForm />

      <div className="space-y-3">
        {employees.length === 0 ? (
          <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-8 text-center border border-[#E5E7EB] dark:border-[#2A2A2A]">
            <div className="text-3xl mb-2">👥</div>
            <p className="text-gray-400 dark:text-gray-500 text-sm">ยังไม่มีพนักงาน กรอกฟอร์มด้านบนเพื่อเพิ่ม</p>
          </div>
        ) : (
          employees.map((emp) => (
            <Link key={emp.id} href={`/owner/employees/${emp.id}`}
              className={`bg-white dark:bg-[#1A1A1A] rounded-2xl p-4 border border-[#E5E7EB] dark:border-[#2A2A2A] flex items-center gap-3 hover:border-[#F5D400] dark:hover:border-[#F5D400] transition-all ${!emp.isActive ? "opacity-50" : ""}`}>
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full flex-shrink-0 overflow-hidden border-2 border-[#F5D400]">
                {emp.profileImage ? (
                  <img src={emp.profileImage} alt={emp.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#FFF8CC] dark:bg-[#2A2200] flex items-center justify-center text-xl font-bold text-[#1A1A1A] dark:text-[#F5D400]">
                    {emp.name.slice(0, 1)}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 dark:text-white">{emp.name}</span>
                  {!emp.isActive && (
                    <span className="text-xs bg-gray-100 dark:bg-[#242424] text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">ปิดการใช้งาน</span>
                  )}
                  {!emp.pinSet && (
                    <span className="text-xs bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full">ยังไม่ตั้ง PIN</span>
                  )}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  เงินเดือน ฿{emp.salary.toLocaleString("th-TH")} · Incentive {emp.incentiveRate}%
                </div>
              </div>

              <span className="text-gray-300 dark:text-gray-600 text-lg">›</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
