"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

function formatK(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return `${value}`;
}

export default function InsightsTrendChart({
  data,
}: {
  data: { date: string; total: number }[];
}) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <h2 className="font-bold text-[#1A1A1A] mb-3">📈 แนวโน้มยอดขายรายวัน</h2>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ left: -20, right: 10 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis tickFormatter={formatK} tick={{ fontSize: 10 }} />
          <Tooltip
            formatter={(val) =>
              new Intl.NumberFormat("th-TH").format(Number(val)) + " บาท"
            }
          />
          <Bar dataKey="total" radius={[4, 4, 0, 0]}
            fill="url(#barGrad)" />
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F5D400" />
              <stop offset="100%" stopColor="#F5A882" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
