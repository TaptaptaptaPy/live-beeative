"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import TodayBadge from "./TodayBadge";

const NAV = [
  { href: "/owner/dashboard",  label: "ภาพรวม",  emoji: "📊" },
  { href: "/owner/schedule",   label: "ตาราง",   emoji: "📅" },
  { href: "/owner/brands",     label: "แบรนด์",  emoji: "🏷️" },
  { href: "/owner/targets",    label: "เป้ายอด",  emoji: "🎯" },
  { href: "/owner/employees",  label: "พนักงาน",  emoji: "👥" },
  { href: "/owner/leave",      label: "วันลา",   emoji: "🏖️" },
  { href: "/owner/finance",    label: "การเงิน",  emoji: "💰" },
  { href: "/owner/payroll",    label: "เงินเดือน", emoji: "💵" },
  { href: "/owner/reports",    label: "รายงาน",  emoji: "📈" },
  { href: "/owner/insights",   label: "วิเคราะห์", emoji: "🔍" },
];

// Pages that benefit from auto-refresh (data changes frequently)
const AUTO_REFRESH_PAGES = ["/owner/dashboard", "/owner/entries", "/owner/logs"];
const REFRESH_INTERVAL_MS = 30_000; // 30 seconds

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const shouldRefresh = AUTO_REFRESH_PAGES.some(p => pathname.startsWith(p));
    if (!shouldRefresh) return;

    const id = setInterval(() => router.refresh(), REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [pathname, router]);

  if (pathname === "/owner/login") return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FFFBEB" }}>
      {/* Top bar */}
      <header className="bg-white border-b-2 border-[#F5D400] px-5 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🐝</span>
          <div>
            <div className="font-bold text-[#1A1A1A] text-lg leading-tight tracking-tight">Beeative LiveBoard</div>
            <div className="text-xs text-[#F5A882] font-semibold tracking-wide">ระบบบันทึกยอดไลฟ์</div>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="text-sm text-gray-500 border border-gray-200 rounded-xl px-4 py-1.5 hover:bg-gray-50 active:scale-95 transition-all"
        >
          ออกจากระบบ
        </button>
      </header>

      <main className="flex-1 pb-24">{children}</main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#F5D400] z-10 overflow-x-auto">
        <div className="flex items-center justify-center gap-1 px-2 py-2 min-w-max mx-auto">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`relative flex flex-col items-center gap-0.5 px-3.5 py-1.5 rounded-2xl transition-all min-w-[60px] ${
                  active
                    ? "text-[#1A1A1A] bg-[#FFF8CC]"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <span className="text-2xl relative leading-none">
                  {item.emoji}
                  {item.href === "/owner/dashboard" && <TodayBadge />}
                </span>
                <span className={`text-[11px] font-medium whitespace-nowrap ${active ? "text-[#1A1A1A] font-bold" : "text-gray-400"}`}>
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
