"use client";

import { deleteEntry } from "@/app/actions/entries";
import { useState } from "react";

export default function DeleteEntryButton({ id }: { id: string }) {
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm) {
      setConfirm(true);
      setTimeout(() => setConfirm(false), 3000);
      return;
    }
    setLoading(true);
    await deleteEntry(id);
    setLoading(false);
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className={`text-xs px-2 py-1 rounded-lg transition-all ${
        confirm
          ? "bg-red-500 text-white"
          : "bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-400"
      }`}
    >
      {loading ? "..." : confirm ? "ยืนยัน" : "🗑️"}
    </button>
  );
}
