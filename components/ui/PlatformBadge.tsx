import { PLATFORM_LABELS } from "@/lib/utils";

const PLATFORM_META: Record<string, { emoji: string; color: string; bg: string }> = {
  TIKTOK:   { emoji: "🎵", color: "#010101", bg: "#01010112" },
  SHOPEE:   { emoji: "🛒", color: "#EE4D2D", bg: "#EE4D2D15" },
  FACEBOOK: { emoji: "📘", color: "#1877F2", bg: "#1877F215" },
  OTHER:    { emoji: "📱", color: "#6B7280", bg: "#6B728018" },
};

export function PlatformBadge({
  platform,
  size = "sm",
}: {
  platform: string;
  size?: "xs" | "sm";
}) {
  const meta = PLATFORM_META[platform] ?? PLATFORM_META.OTHER;
  const sizeClass = size === "xs"
    ? "text-[10px] px-1.5 py-0.5 gap-0.5"
    : "text-[11px] px-2 py-0.5 gap-1";

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full leading-none ${sizeClass}`}
      style={{ background: meta.bg, color: meta.color }}
    >
      {meta.emoji} {PLATFORM_LABELS[platform] ?? platform}
    </span>
  );
}
