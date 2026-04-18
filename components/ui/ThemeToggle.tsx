"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-8 h-8" />;

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`relative w-8 h-8 flex items-center justify-center rounded-xl text-base
        border border-[#E5E7EB] dark:border-[#2A2A2A]
        bg-white dark:bg-[#1A1A1A]
        text-gray-500 dark:text-gray-400
        hover:border-[#F5D400] hover:text-[#1A1A1A] dark:hover:text-[#F5D400]
        transition-all duration-200 ${className}`}
      title={isDark ? "สลับโหมดสว่าง" : "สลับโหมดมืด"}
      aria-label="toggle dark mode"
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}
