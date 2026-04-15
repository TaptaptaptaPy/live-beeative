"use client";

import { toggleLeaveVisibility } from "@/app/actions/leave";
import { useState } from "react";

export default function ToggleLeaveButton({ userId, showLeave }: { userId: string; showLeave: boolean }) {
  const [show, setShow] = useState(showLeave);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    await toggleLeaveVisibility(userId, !show);
    setShow(s => !s);
    setLoading(false);
  }

  return (
    <button onClick={toggle} disabled={loading}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 disabled:opacity-50 ${
        show ? "bg-[#F5D400]" : "bg-gray-200"
      }`}>
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
        show ? "translate-x-6" : "translate-x-1"
      }`} />
    </button>
  );
}
