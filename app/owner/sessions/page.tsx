export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import AddSessionForm from "./AddSessionForm";
import DeleteSessionButton from "./DeleteSessionButton";
import MigrateButton from "./MigrateButton";

export default async function SessionsPage() {
  const sessions = await prisma.liveSession.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 pt-2">ช่วงเวลาไลฟ์</h1>
      <p className="text-sm text-gray-500">กำหนดช่วงเวลาไลฟ์ที่พนักงานสามารถเลือกได้</p>

      <MigrateButton />
      <AddSessionForm />

      <div className="space-y-3">
        {sessions.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm">
            ยังไม่มีช่วงเวลา
          </div>
        ) : (
          sessions.map((s) => (
            <div key={s.id} className={`bg-white rounded-2xl p-4 shadow-sm ${!s.isActive ? "opacity-50" : ""}`}>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold text-gray-800 text-lg">{s.name}</div>
                  <div className="text-gray-500 text-sm mt-0.5">
                    🕐 {s.startTime} – {s.endTime} น.
                  </div>
                  {!s.isActive && (
                    <span className="text-xs text-gray-400">ปิดการใช้งาน</span>
                  )}
                </div>
                <DeleteSessionButton id={s.id} name={s.name} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
