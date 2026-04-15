"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import TodayBadge from "./TodayBadge";

const NAV = [
  { href: "/owner/dashboard",  label: "ภาพรวม",  emoji: "📊" },
  { href: "/owner/schedule",   label: "ตาราง",   emoji: "📅" },
  { href: "/owner/targets",    label: "เป้ายอด",  emoji: "🎯" },
  { href: "/owner/employees",  label: "พนักงาน",  emoji: "👥" },
  { href: "/owner/leave",      label: "วันลา",   emoji: "🏖️" },
  { href: "/owner/finance",    label: "การเงิน",  emoji: "💰" },
  { href: "/owner/reports",    label: "รายงาน",  emoji: "📈" },
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
      <header className="bg-white border-b-2 border-[#F5D400] px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐝</span>
          <div>
            <div className="font-bold text-[#1A1A1A] text-base leading-tight">Beeative LiveBoard</div>
            <div className="text-xs text-[#F5A882] font-medium">ระบบบันทึกยอดไลฟ์</div>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="text-sm text-gray-500 border border-gray-200 rounded-xl px-3 py-1 hover:bg-gray-50"
        >
          ออกจากระบบ
        </button>
      </header>

      <main className="flex-1 pb-20">{children}</main>

      {/* Bottom Nav — scrollable for 7 items */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#F5D400] z-10 overflow-x-auto">
        <div className="flex items-center px-2 py-1.5 min-w-max mx-auto">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all min-w-[56px] ${
                  active ? "text-[#1A1A1A]" : "text-gray-400"
                }`}
              >
                <span className="text-lg relative">
                  {item.emoji}
                  {item.href === "/owner/dashboard" && <TodayBadge />}
                </span>
                <span className={`text-[10px] font-medium whitespace-nowrap ${active ? "text-[#1A1A1A] font-bold" : "text-gray-400"}`}>
                  {item.label}
                </span>
                {active && <div className="w-1 h-1 rounded-full bg-[#F5D400]" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
