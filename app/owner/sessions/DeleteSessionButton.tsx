"use client";

import { deleteLiveSession } from "@/app/actions/sessions";
import { useState } from "react";

export default function DeleteSessionButton({ id, name }: { id: string; name: string }) {
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handle() {
    if (!confirm) {
      setConfirm(true);
      setTimeout(() => setConfirm(false), 3000);
      return;
    }
    setLoading(true);
    await deleteLiveSession(id);
    setLoading(false);
  }

  return (
    <button
      onClick={handle}
      disabled={loading}
      className={`text-sm px-3 py-1.5 rounded-xl font-medium transition-all ${
        confirm ? "bg-red-500 text-white" : "bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500"
      }`}
    >
      {loading ? "..." : confirm ? "ยืนยันลบ?" : "ลบ"}
    </button>
  );
}
