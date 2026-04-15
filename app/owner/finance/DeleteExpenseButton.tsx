"use client";

import { deleteExpense } from "@/app/actions/expenses";
import { useState } from "react";

export default function DeleteExpenseButton({ id }: { id: string }) {
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handle() {
    if (!confirm) { setConfirm(true); setTimeout(() => setConfirm(false), 3000); return; }
    setLoading(true);
    await deleteExpense(id);
    setLoading(false);
  }

  return (
    <button onClick={handle} disabled={loading}
      className={`text-xs px-2 py-1 rounded-lg transition-all ${confirm ? "bg-red-500 text-white" : "bg-gray-100 text-gray-400"}`}>
      {loading ? "..." : confirm ? "ยืนยัน" : "🗑️"}
    </button>
  );
}
