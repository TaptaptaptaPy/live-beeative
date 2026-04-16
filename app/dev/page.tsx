"use client";

import { useState } from "react";
import { devLogin } from "@/app/actions/auth";

export default function DevLoginPage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await devLogin(pin);
    if (result?.error) {
      setError(result.error);
      setPin("");
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[#0f0f0f]">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-3xl shadow-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">⚡</div>
          <h1 className="text-xl font-bold text-white">Developer Access</h1>
          <p className="text-gray-500 text-sm mt-1">Beeative LiveBoard</p>
          <div className="mt-2 h-0.5 w-12 rounded-full mx-auto bg-[#F5D400]" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">DEV PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-[#F5D400] transition-colors"
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-900/30 text-red-400 rounded-xl p-3 text-center text-sm border border-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || pin.length < 4}
            className="w-full h-12 rounded-xl font-bold text-[#1A1A1A] disabled:opacity-30 transition-all"
            style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ Dev Mode"}
          </button>
        </form>

        <div className="text-center mt-6 space-y-2">
          <a href="/owner/login" className="block text-gray-600 text-xs hover:text-gray-400 transition-colors">
            → Owner Login
          </a>
          <a href="/" className="block text-gray-600 text-xs hover:text-gray-400 transition-colors">
            → Staff Login
          </a>
        </div>
      </div>
    </main>
  );
}
