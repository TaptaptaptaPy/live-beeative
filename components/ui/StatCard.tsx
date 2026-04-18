import { cn } from "@/lib/cn";
import { DeltaBadge } from "./Badge";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  delta?: number;
  icon?: string;
  /** gradient variant for hero cards */
  variant?: "default" | "yellow" | "peach" | "green" | "blue" | "purple";
  /** sparkline SVG path data (optional) */
  sparkline?: number[];
  className?: string;
}

const VARIANTS = {
  default: {
    wrap: "bg-white dark:bg-[#1A1A1A] border border-[#E5E7EB] dark:border-[#2A2A2A]",
    label: "text-gray-500 dark:text-gray-400",
    value: "text-gray-900 dark:text-white",
    sub:   "text-gray-400 dark:text-gray-500",
  },
  yellow: {
    wrap:  "bg-gradient-to-br from-[#F5D400] to-[#F5A882] text-[#1A1A1A]",
    label: "text-[#1A1A1A]/70",
    value: "text-[#1A1A1A]",
    sub:   "text-[#1A1A1A]/60",
  },
  peach: {
    wrap:  "bg-gradient-to-br from-[#F5A882] to-[#F5D400] text-[#1A1A1A]",
    label: "text-[#1A1A1A]/70",
    value: "text-[#1A1A1A]",
    sub:   "text-[#1A1A1A]/60",
  },
  green: {
    wrap:  "bg-gradient-to-br from-green-500 to-emerald-600 text-white",
    label: "text-green-100",
    value: "text-white",
    sub:   "text-green-200",
  },
  blue: {
    wrap:  "bg-gradient-to-br from-blue-500 to-indigo-600 text-white",
    label: "text-blue-100",
    value: "text-white",
    sub:   "text-blue-200",
  },
  purple: {
    wrap:  "bg-gradient-to-br from-purple-500 to-purple-700 text-white",
    label: "text-purple-100",
    value: "text-white",
    sub:   "text-purple-200",
  },
};

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 64;
  const h = 24;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  const d = `M ${pts.join(" L ")}`;

  return (
    <svg width={w} height={h} className="opacity-50" viewBox={`0 0 ${w} ${h}`}>
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StatCard({
  label,
  value,
  sub,
  delta,
  icon,
  variant = "default",
  sparkline,
  className,
}: StatCardProps) {
  const v = VARIANTS[variant];
  return (
    <div className={cn("rounded-2xl p-4 space-y-1", v.wrap, className)}>
      <div className="flex items-center justify-between">
        <div className={cn("text-xs font-medium", v.label)}>
          {icon && <span className="mr-1">{icon}</span>}
          {label}
        </div>
        {delta !== undefined && <DeltaBadge delta={delta} />}
      </div>
      <div className={cn("text-xl font-bold leading-tight", v.value)}>{value}</div>
      <div className="flex items-end justify-between">
        {sub && <div className={cn("text-xs", v.sub)}>{sub}</div>}
        {sparkline && <Sparkline data={sparkline} />}
      </div>
    </div>
  );
}
