"use client";

import { useRouter } from "next/navigation";

export default function MonthSelector({ value }: { value: string }) {
  const router = useRouter();
  return (
    <input
      type="month"
      value={value}
      onChange={(e) => router.push(`?month=${e.target.value}`)}
      className="border-2 border-[#F5D400] rounded-xl px-3 py-1.5 text-sm font-medium bg-white focus:outline-none cursor-pointer"
    />
  );
}
