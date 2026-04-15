"use client";

import { toggleEmployee } from "@/app/actions/employees";
import { useState } from "react";

export default function ToggleEmployeeButton({ id, isActive }: { id: string; isActive: boolean }) {
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    await toggleEmployee(id, !isActive);
    setLoading(false);
  }

  return (
    <button
      onClick={handle}
      disabled={loading}
      className={`text-sm px-3 py-1.5 rounded-xl font-medium transition-all ${
        isActive
          ? "bg-red-50 text-red-500 hover:bg-red-100"
          : "bg-green-50 text-green-600 hover:bg-green-100"
      }`}
    >
      {loading ? "..." : isActive ? "ปิดการใช้งาน" : "เปิดใช้งาน"}
    </button>
  );
}
