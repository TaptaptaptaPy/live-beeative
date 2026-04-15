export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import BrandsClient from "./BrandsClient";

export default async function BrandsPage() {
  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    include: {
      entries: { select: { salesAmount: true } }
    },
    orderBy: { name: "asc" },
  });

  const brandsWithStats = brands.map(b => ({
    id: b.id,
    name: b.name,
    commissionRate: b.commissionRate,
    color: b.color,
    notes: b.notes,
    totalSales: b.entries.reduce((s, e) => s + e.salesAmount, 0),
    totalCommission: b.entries.reduce((s, e) => s + (e.salesAmount * b.commissionRate / 100), 0),
    entryCount: b.entries.length,
  }));

  const totalCommission = brandsWithStats.reduce((s, b) => s + b.totalCommission, 0);
  const totalSales = brandsWithStats.reduce((s, b) => s + b.totalSales, 0);

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[#1A1A1A] pt-2">🏷️ แบรนด์ & Commission</h1>

      {/* Summary card */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-[#F5D400]">
          <div className="text-xs text-gray-500 mb-1">ยอดขายรวมทุกแบรนด์</div>
          <div className="text-xl font-bold text-[#1A1A1A]">฿{totalSales.toLocaleString("th-TH", { maximumFractionDigits: 0 })}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-green-400">
          <div className="text-xs text-gray-500 mb-1">รายได้จริง (Commission)</div>
          <div className="text-xl font-bold text-green-600">฿{totalCommission.toLocaleString("th-TH", { maximumFractionDigits: 0 })}</div>
        </div>
      </div>

      <BrandsClient brands={brandsWithStats} />
    </div>
  );
}
