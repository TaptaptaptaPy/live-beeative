"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import TodayBadge from "./TodayBadge";
import DevBanner from "@/app/dev/DevBanner";
import { APP_VERSION } from "@/lib/version";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

// ─── Nav definition ───────────────────────────────────────────────────────────

const NAV_FLAT = [
  { href: "/owner/dashboard",  label: "ภาพรวม",   emoji: "📊" },
  { href: "/owner/entry",      label: "บันทึก",    emoji: "✍️" },
  { href: "/owner/entries",    label: "รายการ",    emoji: "📋" },
  { href: "/owner/schedule",   label: "ตาราง",    emoji: "📅" },
  { href: "/owner/brands",     label: "แบรนด์",   emoji: "🏷️" },
  { href: "/owner/targets",    label: "เป้ายอด",   emoji: "🎯" },
  { href: "/owner/employees",  label: "พนักงาน",   emoji: "👥" },
  { href: "/owner/leave",      label: "วันลา",    emoji: "🏖️" },
  { href: "/owner/finance",    label: "การเงิน",   emoji: "💰" },
  { href: "/owner/payroll",    label: "เงินเดือน", emoji: "💵" },
  { href: "/owner/reports",    label: "รายงาน",   emoji: "📈" },
  { href: "/owner/insights",   label: "วิเคราะห์", emoji: "🔍" },
  { href: "/owner/logs",       label: "Log",        emoji: "🗒️" },
];

const NAV_GROUPS = [
  {
    label: null,
    items: NAV_FLAT.slice(0, 4), // Dashboard, Entry, Entries, Schedule
  },
  {
    label: "จัดการ",
    items: NAV_FLAT.slice(4, 8), // Brands, Targets, Employees, Leave
  },
  {
    label: "การเงิน & รายงาน",
    items: NAV_FLAT.slice(8),    // Finance, Payroll, Reports, Insights, Logs
  },
];

// Auto-refresh on these pages
const AUTO_REFRESH_PAGES = ["/owner/dashboard", "/owner/entries", "/owner/logs"];
const REFRESH_INTERVAL_MS = 30_000;

// ─── Sidebar nav link ─────────────────────────────────────────────────────────

function SideNavLink({
  href, label, emoji, active,
}: {
  href: string; label: string; emoji: string; active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
        active
          ? "bg-[#FFF8CC] dark:bg-[#2A2200] text-[#1A1A1A] dark:text-[#F5D400]"
          : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#242424] hover:text-gray-800 dark:hover:text-gray-200"
      }`}
    >
      <span className="text-lg leading-none relative flex-shrink-0">
        {emoji}
        {href === "/owner/dashboard" && <TodayBadge />}
      </span>
      <span className="truncate">{label}</span>
      {active && (
        <span className="ml-auto w-1 h-4 rounded-full bg-[#F5D400] flex-shrink-0" />
      )}
    </Link>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();

  useEffect(() => {
    const shouldRefresh = AUTO_REFRESH_PAGES.some(p => pathname.startsWith(p));
    if (!shouldRefresh) return;
    const id = setInterval(() => router.refresh(), REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [pathname, router]);

  if (pathname === "/owner/login") return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFBEB] dark:bg-[#0F0F0F] transition-colors duration-300">
      <DevBanner />

      {/* ── Top header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-white dark:bg-[#1A1A1A] border-b-2 border-[#F5D400] px-4 md:px-5 py-3 flex items-center justify-between shadow-sm dark:shadow-none">
        <div className="flex items-center gap-3">
          {/* Brand */}
          <span className="text-3xl select-none">🐝</span>
          <div>
            <div className="font-bold text-[#1A1A1A] dark:text-white text-lg leading-tight tracking-tight">
              Beeative LiveBoard
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#F5A882] font-semibold tracking-wide hidden sm:block">
                ระบบบันทึกยอดไลฟ์
              </span>
              <Link
                href="/owner/changelog"
                className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 border border-gray-200 dark:border-[#2A2A2A] rounded-full px-1.5 py-0.5 leading-none transition-colors"
              >
                v{APP_VERSION}
              </Link>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => logout()}
            className="text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#2A2A2A] rounded-xl px-3 md:px-4 py-1.5 hover:bg-gray-50 dark:hover:bg-[#242424] active:scale-95 transition-all"
          >
            <span className="hidden sm:inline">ออกจากระบบ</span>
            <span className="sm:hidden">ออก</span>
          </button>
        </div>
      </header>

      {/* ── Body: sidebar + main ─────────────────────────────────────────────── */}
      <div className="flex flex-1">

        {/* ── Desktop sidebar (md+) ── */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 sticky top-14 self-start h-[calc(100vh-3.5rem)] bg-white dark:bg-[#1A1A1A] border-r border-[#E5E7EB] dark:border-[#2A2A2A]">
          {/* Nav groups */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-5">
            {NAV_GROUPS.map((group, gi) => (
              <div key={gi}>
                {group.label && (
                  <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-3 mb-1.5">
                    {group.label}
                  </div>
                )}
                <div className="space-y-0.5">
                  {group.items.map(item => (
                    <SideNavLink
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      emoji={item.emoji}
                      active={pathname.startsWith(item.href)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Sidebar footer */}
          <div className="p-3 border-t border-[#E5E7EB] dark:border-[#2A2A2A] space-y-1">
            <Link
              href="/owner/changelog"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-[#242424] hover:text-gray-600 dark:hover:text-gray-300 transition-all"
            >
              <span>📝</span>
              <span>v{APP_VERSION} · changelog</span>
            </Link>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0 pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom nav (hidden on md+) ──────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1A1A1A] border-t-2 border-[#F5D400] z-10 overflow-x-auto">
        <div className="flex items-center justify-center gap-1 px-2 py-2 min-w-max mx-auto">
          {NAV_FLAT.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center gap-0.5 px-3.5 py-1.5 rounded-2xl transition-all min-w-[60px] ${
                  active
                    ? "text-[#1A1A1A] dark:text-white bg-[#FFF8CC] dark:bg-[#2A2200]"
                    : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                }`}
              >
                <span className="text-2xl relative leading-none">
                  {item.emoji}
                  {item.href === "/owner/dashboard" && <TodayBadge />}
                </span>
                <span className={`text-[11px] font-medium whitespace-nowrap ${active ? "text-[#1A1A1A] dark:text-white font-bold" : "text-gray-400 dark:text-gray-500"}`}>
                  {item.label}
                </span>
                {active && <div className="w-5 h-0.5 rounded-full bg-[#F5D400]" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
