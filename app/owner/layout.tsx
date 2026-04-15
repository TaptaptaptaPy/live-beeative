"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { logout } from "@/app/actions/auth";

const NAV = [
  { href: "/owner/dashboard", label: "Dashboard", emoji: "📊" },
  { href: "/owner/entries", label: "รายการ", emoji: "📋" },
  { href: "/owner/incentive", label: "Incentive", emoji: "💰" },
  { href: "/owner/employees", label: "พนักงาน", emoji: "👥" },
  { href: "/owner/sessions", label: "ช่วงเวลา", emoji: "⏰" },
];

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/owner/login") return <>{children}</>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📺</span>
          <span className="font-bold text-gray-800 text-lg">live_beeative</span>
        </div>
        <button
          onClick={() => logout()}
          className="text-sm text-gray-500 border border-gray-200 rounded-xl px-3 py-1 hover:bg-gray-50"
        >
          ออกจากระบบ
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 pb-20">{children}</main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-around px-2 py-2 z-10">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all ${
                active ? "text-indigo-600" : "text-gray-400"
              }`}
            >
              <span className="text-xl">{item.emoji}</span>
              <span className={`text-xs font-medium ${active ? "text-indigo-600" : "text-gray-400"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
