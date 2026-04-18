import { cn } from "@/lib/cn";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "tiktok"
  | "shopee"
  | "facebook"
  | "bee";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default:  "bg-gray-100 text-gray-700 dark:bg-[#2A2A2A] dark:text-gray-300",
  success:  "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  warning:  "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  danger:   "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  info:     "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  tiktok:   "bg-[#010101] text-white",
  shopee:   "bg-[#EE4D2D] text-white",
  facebook: "bg-[#1877F2] text-white",
  bee:      "bg-[#F5D400] text-[#1A1A1A]",
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export function Badge({ variant = "default", children, className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none",
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}

/** Delta badge: shows ▲12% or ▼5% */
export function DeltaBadge({ delta, className }: { delta: number; className?: string }) {
  if (delta === 0) return null;
  const up = delta > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg px-1.5 py-0.5 text-[11px] font-bold",
        up
          ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
          : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
        className
      )}
    >
      {up ? "▲" : "▼"}{Math.abs(delta)}%
    </span>
  );
}

/** Platform-specific badge */
const PLATFORM_MAP: Record<string, { variant: BadgeVariant; label: string; emoji: string }> = {
  TIKTOK:   { variant: "tiktok",   label: "TikTok",   emoji: "🎵" },
  SHOPEE:   { variant: "shopee",   label: "Shopee",   emoji: "🛒" },
  FACEBOOK: { variant: "facebook", label: "Facebook", emoji: "📘" },
  OTHER:    { variant: "default",  label: "อื่นๆ",    emoji: "📱" },
};

export function PlatformBadge({ platform }: { platform: string }) {
  const meta = PLATFORM_MAP[platform] ?? PLATFORM_MAP.OTHER;
  return (
    <Badge variant={meta.variant}>
      {meta.emoji} {meta.label}
    </Badge>
  );
}
