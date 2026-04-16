"use client";

import { deleteCampaignTarget } from "@/app/actions/targets";
import { useState } from "react";

export default function DeleteCampaignButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("ลบแคมเปญนี้?")) return;
    setLoading(true);
    await deleteCampaignTarget(id);
    setLoading(false);
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      title="ลบแคมเปญ"
      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all text-sm disabled:opacity-50"
    >
      🗑️
    </button>
  );
}
