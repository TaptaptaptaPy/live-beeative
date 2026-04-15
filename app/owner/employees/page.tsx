export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import AddEmployeeForm from "./AddEmployeeForm";
import ToggleEmployeeButton from "./ToggleEmployeeButton";

export default async function EmployeesPage() {
  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 pt-2">จัดการพนักงาน</h1>

      {/* Add employee form */}
      <AddEmployeeForm />

      {/* Employee list */}
      <div className="space-y-3">
        {employees.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm">
            ยังไม่มีพนักงาน กรอกฟอร์มด้านบนเพื่อเพิ่ม
          </div>
        ) : (
          employees.map((emp) => (
            <div key={emp.id} className={`bg-white rounded-2xl p-4 shadow-sm ${!emp.isActive ? "opacity-50" : ""}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800 text-lg">{emp.name}</span>
                    {!emp.isActive && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        ปิดการใช้งาน
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    PIN: {'*'.repeat(4)} · Incentive: {emp.incentiveRate}%
                  </div>
                </div>
                <ToggleEmployeeButton id={emp.id} isActive={emp.isActive} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
