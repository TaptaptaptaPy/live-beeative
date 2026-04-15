"use client";

import { deleteIncentiveRule } from "@/app/actions/incentive";
import { useState } from "react";

export default function DeleteRuleButton({ id }: { id: string }) {
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handle() {
    if (!confirm) {
      setConfirm(true);
      setTimeout(() => setConfirm(false), 3000);
      return;
    }
    setLoading(true);
    await deleteIncentiveRule(id);
    setLoading(false);
  }

  return (
    <button
      onClick={handle}
      disabled={loading}
      className={`text-sm px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 ${
        confirm ? "bg-red-500 text-white" : "bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500"
      }`}
    >
      {loading ? "..." : confirm ? "ยืนยัน?" : "ลบ"}
    </button>
  );
}
