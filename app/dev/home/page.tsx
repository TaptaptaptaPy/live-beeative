export const dynamic = "force-dynamic";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DevSwitchButtons from "./DevSwitchButtons";

export default async function DevHomePage() {
  const session = await getSession();
  if (!session?.isDevMode) redirect("/dev");

  const [employees, recentLogs] = await Promise.all([
    prisma.user.findMany({
      where: { role: "EMPLOYEE", isActive: true, deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, profileImage: true },
    }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { userName: true, action: true, createdAt: true, userRole: true },
    }),
  ]);

  const stats = await prisma.timeEntry.aggregate({
    _count: true,
    _sum: { salesAmount: true },
    where: {
      date: { gte: new Date().toISOString().slice(0, 7) + "-01" },
    },
  });

  return (
    <main className="min-h-screen bg-[#0f0f0f] p-4 pb-20">
      <div className="max-w-lg mx-auto space-y-4">

        {/* Header */}
        <div className="pt-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-[#F5D400]">⚡</span> Developer Mode
            </h1>
            <p className="text-gray-500 text-xs mt-0.5">Beeative LiveBoard · Full access</p>
          </div>
          <form action="/api/dev/logout" method="POST">
            <button className="text-xs text-gray-600 border border-[#333] rounded-lg px-3 py-1.5 hover:border-gray-500 transition-colors text-white">
              ออก
            </button>
          </form>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
            <div className="text-gray-500 text-xs mb-1">ยอดขายเดือนนี้</div>
            <div className="text-white font-bold text-lg">
              ฿{(stats._sum.salesAmount ?? 0).toLocaleString("th-TH", { maximumFractionDigits: 0 })}
            </div>
            <div className="text-gray-600 text-xs">{stats._count} รายการ</div>
          </div>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
            <div className="text-gray-500 text-xs mb-1">พนักงานทั้งหมด</div>
            <div className="text-white font-bold text-lg">{employees.length} คน</div>
            <div className="text-gray-600 text-xs">active</div>
          </div>
        </div>

        {/* Access buttons */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 space-y-3">
          <h2 className="text-white font-semibold text-sm">🔑 เข้าถึงหน้าต่างๆ</h2>

          <a href="/owner/dashboard"
            className="flex items-center justify-between w-full bg-[#111] hover:bg-[#222] border border-[#333] rounded-xl px-4 py-3 transition-colors group">
            <div className="flex items-center gap-3">
              <span className="text-xl">📊</span>
              <div className="text-left">
                <div className="text-white text-sm font-medium">Owner Dashboard</div>
                <div className="text-gray-500 text-xs">/owner/dashboard — ดูยอด, ตาราง, การเงิน</div>
              </div>
            </div>
            <span className="text-gray-600 group-hover:text-gray-400">→</span>
          </a>

          <DevSwitchButtons employees={employees} />
        </div>

        {/* Recent logs */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
          <h2 className="text-white font-semibold text-sm mb-3">🗒️ กิจกรรมล่าสุด</h2>
          <div className="space-y-2">
            {recentLogs.map((log, i) => (
              <div key={i} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    log.userRole === "OWNER" ? "bg-[#F5D400]" : "bg-blue-400"
                  }`} />
                  <span className="text-gray-400">{log.userName}</span>
                  <span className="text-gray-600">{log.action}</span>
                </div>
                <span className="text-gray-700">
                  {new Date(log.createdAt).toLocaleTimeString("th-TH", {
                    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok",
                  })}
                </span>
              </div>
            ))}
          </div>
          <a href="/owner/logs" className="block text-center text-[#F5D400] text-xs mt-3 hover:opacity-80">
            ดูทั้งหมด →
          </a>
        </div>

      </div>
    </main>
  );
}
