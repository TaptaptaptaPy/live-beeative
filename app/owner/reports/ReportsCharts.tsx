"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

type ChartPoint = { key: string; total: number };
type PlatformPoint = { name: string; total: number };

const COLORS = ["#F5D400", "#F5A882", "#6366f1", "#34d399", "#fb923c"];

function formatK(val: number) {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
  return val.toString();
}

function formatLabel(key: string, granularity: string) {
  if (granularity === "month") return key.slice(0, 7);
  if (granularity === "week") return `สัปดาห์\n${key.slice(5)}`;
  if (granularity === "day") return key.slice(5); // MM-DD
  return key.length > 12 ? key.slice(0, 12) + "…" : key;
}

export default function ReportsCharts({
  chartData,
  byPlatform,
  granularity,
}: {
  chartData: ChartPoint[];
  byPlatform: PlatformPoint[];
  granularity: string;
}) {
  if (chartData.length === 0 && byPlatform.length === 0) return null;

  const displayData = chartData.map((d) => ({
    ...d,
    label: formatLabel(d.key, granularity),
  }));

  return (
    <div className="space-y-3">
      {/* Bar Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-bold text-[#1A1A1A] mb-3">📈 ยอดขายตามช่วงเวลา</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={displayData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={formatK}
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                formatter={(val) => [`฿${Number(val).toLocaleString("th-TH")}`, "ยอดขาย"]}
                contentStyle={{ borderRadius: 12, border: "2px solid #F5D400", fontSize: 13 }}
              />
              <Bar dataKey="total" radius={[6, 6, 0, 0]}
                fill="url(#barGrad)" maxBarSize={48} />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F5D400" />
                  <stop offset="100%" stopColor="#F5A882" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Pie Chart */}
      {byPlatform.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-bold text-[#1A1A1A] mb-3">🥧 สัดส่วนตาม Platform</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={byPlatform}
                dataKey="total"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={72}
                label={(props) => {
                  const pct = ((props.percent ?? 0) * 100).toFixed(0);
                  return `${pct}%`;
                }}
                labelLine={false}
              >
                {byPlatform.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend
                formatter={(value) => (
                  <span style={{ fontSize: 12, color: "#374151" }}>{value}</span>
                )}
              />
              <Tooltip
                formatter={(val) => [`฿${Number(val).toLocaleString("th-TH")}`, ""]}
                contentStyle={{ borderRadius: 12, border: "2px solid #F5D400", fontSize: 13 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
