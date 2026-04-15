export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import AddRuleForm from "./AddRuleForm";
import DeleteRuleButton from "./DeleteRuleButton";
import IncentiveCalculator from "./IncentiveCalculator";

export default async function IncentivePage() {
  const [rules, employees] = await Promise.all([
    prisma.incentiveRule.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.user.findMany({
      where: { role: "EMPLOYEE", isActive: true },
      include: {
        entries: {
          where: {
            date: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                .toISOString()
                .slice(0, 10),
            },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const activeRules = rules.filter((r) => r.isActive);

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 pt-2">คำนวณ Incentive</h1>

      {/* Calculator */}
      <IncentiveCalculator employees={employees.map(e => ({
        id: e.id,
        name: e.name,
        incentiveRate: e.incentiveRate,
        totalSales: e.entries.reduce((s, en) => s + en.salesAmount, 0),
        entryCount: e.entries.length,
      }))} />

      {/* Rules section */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-lg font-bold text-gray-800">กฎ Incentive</h2>
      </div>

      <AddRuleForm />

      <div className="space-y-3">
        {rules.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm">
            ยังไม่มีกฎ Incentive
          </div>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className={`bg-white rounded-2xl p-4 shadow-sm ${!rule.isActive ? "opacity-50" : ""}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">{rule.name}</div>
                  {rule.description && (
                    <div className="text-sm text-gray-500 mt-0.5">{rule.description}</div>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                      {rule.type === "PERCENTAGE" ? `${rule.value}% ของยอดขาย` :
                       rule.type === "FIXED" ? `฿${rule.value.toLocaleString()} คงที่` :
                       `โบนัส ฿${rule.value.toLocaleString()}`}
                    </span>
                    {rule.minSales !== null && (
                      <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                        ยอดขั้นต่ำ {formatCurrency(rule.minSales!)}
                      </span>
                    )}
                    {rule.maxSales !== null && (
                      <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full">
                        สูงสุด {formatCurrency(rule.maxSales!)}
                      </span>
                    )}
                  </div>
                </div>
                <DeleteRuleButton id={rule.id} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
