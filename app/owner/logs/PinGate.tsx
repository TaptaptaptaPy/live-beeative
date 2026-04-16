"use client";

import { useState } from "react";

const CORRECT_PIN = "0579";

export default function PinGate({ children }: { children: React.ReactNode }) {
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);

  if (unlocked) return <>{children}</>;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin === CORRECT_PIN) {
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setPin("");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🔐</div>
          <h1 className="text-xl font-bold text-[#1A1A1A]">บันทึกกิจกรรม</h1>
          <p className="text-xs text-gray-400 mt-1 font-medium tracking-wide">Developer Access</p>
          <p className="text-sm text-gray-500 mt-2">สำหรับผู้พัฒนาเท่านั้น</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 block mb-2 font-medium">กรอก PIN 4 หลัก</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                setError(false);
                setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
              }}
              placeholder="••••"
              className={`w-full border-2 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] font-bold focus:outline-none transition-colors ${
                error
                  ? "border-red-400 focus:border-red-400"
                  : "border-gray-200 focus:border-[#F5D400]"
              }`}
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-sm text-center mt-2 font-medium">PIN ไม่ถูกต้อง</p>
            )}
          </div>

          <button
            type="submit"
            disabled={pin.length !== 4}
            className="w-full h-12 rounded-xl font-semibold text-sm text-[#1A1A1A] disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}
          >
            ยืนยัน PIN
          </button>
        </form>
      </div>
    </div>
  );
}
