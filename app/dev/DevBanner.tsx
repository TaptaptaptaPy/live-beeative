"use client";

import { useEffect, useState } from "react";
import { devSwitchToOwner } from "@/app/actions/auth";

type MeResponse = {
  isDevMode?: boolean;
  role: "OWNER" | "EMPLOYEE";
  devAsUserName?: string | null;
};

export default function DevBanner() {
  const [devInfo, setDevInfo] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d: MeResponse) => {
        if (d?.isDevMode) setDevInfo(d);
      })
      .catch(() => {});
  }, []);

  if (!devInfo?.isDevMode) return null;

  async function backToOwner() {
    setLoading(true);
    await devSwitchToOwner();
  }

  const isStaffView = devInfo.role === "EMPLOYEE";

  return (
    <>
      {/* Spacer so content doesn't hide under banner */}
      <div className="h-8" />
      <div
        className="fixed top-0 left-0 right-0 z-[999] flex items-center justify-between px-4 py-1.5"
        style={{
          background: "linear-gradient(90deg,#111,#1f1f1f)",
          borderBottom: "2px solid #F5D400",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[#F5D400] text-xs font-bold">⚡ DEV</span>
          <span className="text-gray-400 text-[11px]">
            {isStaffView && devInfo.devAsUserName
              ? `ดูในฐานะ "${devInfo.devAsUserName}" (staff)`
              : "Owner view"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/dev/home"
            className="text-[10px] text-gray-500 hover:text-gray-300 border border-[#333] rounded px-2 py-0.5 transition-colors"
          >
            Dev Home
          </a>
          {isStaffView && (
            <button
              onClick={backToOwner}
              disabled={loading}
              className="text-[10px] font-bold text-[#1A1A1A] rounded px-2.5 py-0.5 disabled:opacity-50"
              style={{ background: "linear-gradient(90deg,#F5D400,#F5A882)" }}
            >
              {loading ? "..." : "← Owner"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
