export const PLATFORM_LABELS: Record<string, string> = {
  TIKTOK: "TikTok",
  SHOPEE: "Shopee",
  FACEBOOK: "Facebook",
  OTHER: "อื่นๆ",
};

export const PLATFORM_COLORS: Record<string, string> = {
  TIKTOK: "#010101",
  SHOPEE: "#EE4D2D",
  FACEBOOK: "#1877F2",
  OTHER: "#6B7280",
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

export function todayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getDateRange(period: "today" | "week" | "month"): {
  start: string;
  end: string;
} {
  const today = new Date();
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  if (period === "today") {
    const s = fmt(today);
    return { start: s, end: s };
  }
  if (period === "week") {
    const day = today.getDay();
    const mon = new Date(today);
    mon.setDate(today.getDate() - ((day + 6) % 7));
    return { start: fmt(mon), end: fmt(today) };
  }
  // month
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  return { start: fmt(firstDay), end: fmt(today) };
}
