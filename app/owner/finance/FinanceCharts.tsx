"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts";

type Props = {
  totalRevenue: number;
  totalExpenses: number;
  catData: { label: string; emoji: string; total: number }[];
};

const COLORS = ["#F5D400", "#F5A882", "#1A1A1A", "#6B7280", "#22c55e", "#3b82f6", "#a855f7", "#ef4444", "#14b8a6"];

export default function FinanceCharts({ totalRevenue, totalExpenses, catData }: Props) {
  const summaryData = [
    { name: "รายได้", value: totalRevenue, color: "#22c55e" },
    { name: "รายจ่าย", value: totalExpenses, color: "#ef4444" },
  ];

  const profit = totalRevenue - totalExpenses;

  return (
    <div className="space-y-4">
      {/* Revenue vs Expense bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="font-bold text-[#1A1A1A] mb-3">📈 รายได้ vs รายจ่าย</h2>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={summaryData} margin={{ left: -20, right: 10 }}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => new Intl.NumberFormat("th-TH").format(Number(v)) + " บาท"} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {summaryData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Profit indicator */}
        <div className={`mt-3 rounded-xl p-3 text-center ${profit >= 0 ? "bg-[#FFF8CC]" : "bg-red-50"}`}>
          <span className="text-sm font-medium text-gray-600">กำไรสุทธิ: </span>
          <span className={`font-bold text-lg ${profit >= 0 ? "text-[#1A1A1A]" : "text-red-600"}`}>
            {profit >= 0 ? "+" : ""}{new Intl.NumberFormat("th-TH").format(profit)} บาท
          </span>
        </div>
      </div>

      {/* Expense breakdown pie */}
      {catData.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-bold text-[#1A1A1A] mb-3">🥧 สัดส่วนรายจ่าย</h2>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={catData} dataKey="total" nameKey="label" cx="50%" cy="50%" outerRadius={60}
                label={(props) => `${props.name} ${((props.percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}>
                {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => new Intl.NumberFormat("th-TH").format(Number(v)) + " บาท"} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
