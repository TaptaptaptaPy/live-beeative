"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type Props = {
  byEmployee: { name: string; total: number }[];
  byPlatform: { platform: string; total: number }[];
  dailyTrend: { date: string; total: number }[];
  period: string;
};

const COLORS = ["#6366f1", "#f97316", "#3b82f6", "#6b7280", "#a855f7", "#22c55e"];

function formatK(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return `${value}`;
}

export default function DashboardCharts({ byEmployee, byPlatform, dailyTrend, period }: Props) {
  return (
    <div className="space-y-4">
      {/* Daily trend (only for week/month) */}
      {period !== "today" && dailyTrend.length > 1 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-3">📈 ยอดขายรายวัน</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={dailyTrend} margin={{ left: -20, right: 10 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={formatK} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(val) =>
                  new Intl.NumberFormat("th-TH").format(Number(val)) + " บาท"
                }
              />
              <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Platform pie chart */}
      {byPlatform.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-3">📊 สัดส่วน Platform</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={byPlatform}
                dataKey="total"
                nameKey="platform"
                cx="50%"
                cy="50%"
                outerRadius={65}
                label={(props) => {
                  const pct = props.percent ?? 0;
                  return `${props.name} ${(pct * 100).toFixed(0)}%`;
                }}
                labelLine={false}
              >
                {byPlatform.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val) =>
                  new Intl.NumberFormat("th-TH").format(Number(val)) + " บาท"
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
