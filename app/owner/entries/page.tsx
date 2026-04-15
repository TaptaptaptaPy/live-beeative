export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatCurrency, PLATFORM_LABELS, todayString } from "@/lib/utils";
import DeleteEntryButton from "./DeleteEntryButton";

export default async function EntriesPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; userId?: string; platform?: string }>;
}) {
  const { date, userId, platform } = await searchParams;

  const [entries, employees] = await Promise.all([
    prisma.timeEntry.findMany({
      where: {
        ...(date ? { date } : {}),
        ...(userId ? { userId } : {}),
        ...(platform ? { platform: platform as "TIKTOK" | "SHOPEE" | "FACEBOOK" | "OTHER" } : {}),
      },
      include: { user: true, session: true },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
    prisma.user.findMany({
      where: { role: "EMPLOYEE" },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalSales = entries.reduce((s, e) => s + e.salesAmount, 0);

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 pt-2">รายการบันทึก</h1>

      {/* Filters */}
      <form className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-500 block mb-1">วันที่</label>
            <input
              name="date"
              type="date"
              defaultValue={date || ""}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="text-sm text-gray-500 block mb-1">พนักงาน</label>
            <select
              name="userId"
              defaultValue={userId || ""}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">ทั้งหมด</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-500 block mb-1">Platform</label>
          <select
            name="platform"
            defaultValue={platform || ""}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">ทั้งหมด</option>
            {Object.entries(PLATFORM_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="w-full h-10 bg-indigo-500 text-white rounded-xl text-sm font-semibold"
        >
          ค้นหา
        </button>
        <a
          href="/owner/entries"
          className="block text-center text-gray-400 text-sm"
        >
          ล้างตัวกรอง
        </a>
      </form>

      {/* Summary */}
      <div className="bg-indigo-50 rounded-2xl p-4 flex justify-between items-center">
        <div>
          <div className="text-sm text-indigo-600 font-medium">{entries.length} รายการ</div>
          <div className="text-xl font-bold text-indigo-700">{formatCurrency(totalSales)}</div>
        </div>
        <div className="text-3xl">💰</div>
      </div>

      {/* List */}
      {entries.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm">
          ไม่พบรายการ
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800">{entry.user.name}</span>
                    <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                      {PLATFORM_LABELS[entry.platform]}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    📅 {entry.date} · ⏰ {entry.session?.name || `${entry.customStart}–${entry.customEnd}`}
                  </div>
                  {entry.notes && (
                    <div className="text-xs text-gray-400 mt-1">📝 {entry.notes}</div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span className="font-bold text-green-600 text-lg">
                    {formatCurrency(entry.salesAmount)}
                  </span>
                  <DeleteEntryButton id={entry.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
