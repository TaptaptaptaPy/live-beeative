export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import BulkEntryForm from "./BulkEntryForm";

export default async function BulkEntryPage() {
  const [employees, bulkEntries] = await Promise.all([
    prisma.user.findMany({ where: { role: "EMPLOYEE", isActive: true }, orderBy: { name: "asc" } }),
    prisma.bulkEntry.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const PERIOD_LABELS: Record<string, string> = {
    DAILY: "รายวัน", WEEKLY: "รายสัปดาห์",
    MONTHLY: "รายเดือน", YEARLY: "รายปี", CUSTOM: "กำหนดเอง",
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">📥 ลงยอดย้อนหลัง (เจ้าของ)</h1>
        <p className="text-sm text-gray-500 mt-1">ใช้สำหรับลงยอดก่อนมีระบบ หรือลงยอดรวมรายช่วงเวลา</p>
      </div>

      <BulkEntryForm employees={employees.map(e => ({ id: e.id, name: e.name }))} />

      {/* ประวัติ bulk entries */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="font-bold text-[#1A1A1A] mb-3">📋 ประวัติการลงย้อนหลัง</h2>
        {bulkEntries.length === 0 ? (
          <p className="text-gray-400 text-center py-4">ยังไม่มีข้อมูล</p>
        ) : (
          <div className="space-y-2">
            {bulkEntries.map(entry => (
              <div key={entry.id} className="border border-gray-100 rounded-xl p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs bg-[#FFF8CC] text-[#1A1A1A] px-2 py-0.5 rounded-full font-medium">
                        {PERIOD_LABELS[entry.periodType]}
                      </span>
                      <span className="text-sm font-semibold text-[#1A1A1A]">
                        {entry.user ? entry.user.name : "ทุกพนักงาน"}
                      </span>
                      {entry.platform && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {entry.platform}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {entry.startDate} → {entry.endDate}
                    </div>
                    {entry.notes && <div className="text-xs text-gray-400">📝 {entry.notes}</div>}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">
                      ฿{entry.totalSales.toLocaleString("th-TH")}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(entry.createdAt).toLocaleDateString("th-TH")}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
