"use client";

import { deleteWorkSchedule } from "@/app/actions/schedule";
import { useState } from "react";

export default function DeleteScheduleButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("ลบรายการนี้?")) return;
    setLoading(true);
    await deleteWorkSchedule(id);
    setLoading(false);
  }

  return (
    <button onClick={handleDelete} disabled={loading}
      className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-all disabled:opacity-40">
      {loading ? "..." : "ลบ"}
    </button>
  );
}
