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
} from "recharts";
import { useEffect, useState } from "react";

type Props = {
  byEmployee: { name: string; total: number }[];
  byPlatform: { platform: string; total: number; key: string }[];
  dailyTrend: { date: string; total: number }[];
  period: string;
};

// Platform brand colors
const PLATFORM_COLORS: Record<string, string> = {
  TikTok:   "#69C9D0",
  Shopee:   "#EE4D2D",
  Facebook: "#1877F2",
  "อื่นๆ":  "#6B7280",
};

const FALLBACK_COLORS = ["#F5D400", "#F5A882", "#6366f1", "#22c55e", "#a855f7"];

function formatK(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)     return `${(value / 1_000).toFixed(0)}K`;
  return `${value}`;
}

function useIsDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const check = () => setDark(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#1A1A1A] border border-[#E5E7EB] dark:border-[#2A2A2A] rounded-xl px-3 py-2 shadow-lg text-xs">
      <div className="text-gray-500 dark:text-gray-400 mb-0.5">{label}</div>
      <div className="font-bold text-gray-900 dark:text-white">
        ฿{new Intl.NumberFormat("th-TH").format(payload[0].value)}
      </div>
    </div>
  );
}

export default function DashboardCharts({ byEmployee, byPlatform, dailyTrend, period }: Props) {
  const dark = useIsDark();

  const axisColor  = dark ? "#52525B" : "#D1D5DB";
  const labelColor = dark ? "#71717A" : "#9CA3AF";
  const gridColor  = dark ? "#2A2A2A" : "#F3F4F6";

  return (
    <div className="space-y-4">

      {/* Daily trend bar chart */}
      {period !== "today" && dailyTrend.length > 1 && (
        <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-4 border border-[#E5E7EB] dark:border-[#2A2A2A]">
          <h2 className="font-bold text-gray-800 dark:text-white mb-3">📈 ยอดขายรายวัน</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={dailyTrend} margin={{ left: -20, right: 8 }}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: labelColor }}
                axisLine={{ stroke: axisColor }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatK}
                tick={{ fontSize: 11, fill: labelColor }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: gridColor }} />
              <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                {dailyTrend.map((_, i) => (
                  <Cell
                    key={i}
                    fill={
                      i === dailyTrend.length - 1
                        ? "#F5D400"        // latest day = yellow
                        : dark ? "#2A2A2A" : "#E5E7EB"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Platform donut chart */}
      {byPlatform.length > 0 && (
        <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-4 border border-[#E5E7EB] dark:border-[#2A2A2A]">
          <h2 className="font-bold text-gray-800 dark:text-white mb-3">🍩 สัดส่วน Platform</h2>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie
                  data={byPlatform}
                  dataKey="total"
                  nameKey="platform"
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={65}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {byPlatform.map((p, i) => (
                    <Cell
                      key={i}
                      fill={PLATFORM_COLORS[p.platform] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="flex-1 space-y-2">
              {byPlatform.map((p, i) => {
                const color = PLATFORM_COLORS[p.platform] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length];
                const total = byPlatform.reduce((s, x) => s + x.total, 0);
                const pct   = total > 0 ? Math.round((p.total / total) * 100) : 0;
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">{p.platform}</div>
                      <div className="h-1.5 bg-gray-100 dark:bg-[#2A2A2A] rounded-full mt-0.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: color }}
                        />
                      </div>
                    </div>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 tabular-nums flex-shrink-0">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
