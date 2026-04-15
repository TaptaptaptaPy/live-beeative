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
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[#1A1A1A] pt-2">👥 จัดการพนักงาน</h1>

      <AddEmployeeForm />

      <div className="space-y-3">
        {employees.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm">
            ยังไม่มีพนักงาน กรอกฟอร์มด้านบนเพื่อเพิ่ม
          </div>
        ) : (
          employees.map((emp) => (
            <Link key={emp.id} href={`/owner/employees/${emp.id}`}
              className={`bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition-all ${!emp.isActive ? "opacity-50" : ""}`}>
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full flex-shrink-0 overflow-hidden border-2 border-[#F5D400]">
                {emp.profileImage ? (
                  <img src={emp.profileImage} alt={emp.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#FFF8CC] flex items-center justify-center text-xl font-bold text-[#1A1A1A]">
                    {emp.name.slice(0, 1)}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[#1A1A1A]">{emp.name}</span>
                  {!emp.isActive && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">ปิดการใช้งาน</span>
                  )}
                  {!emp.pinSet && (
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">ยังไม่ตั้ง PIN</span>
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-0.5">
                  เงินเดือน ฿{emp.salary.toLocaleString("th-TH")} · Incentive {emp.incentiveRate}%
                </div>
              </div>

              <span className="text-gray-300 text-lg">›</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
