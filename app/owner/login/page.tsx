"use client";

import { useState } from "react";
import { ownerLogin } from "@/app/actions/auth";

export default function OwnerLoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = await ownerLogin(formData);
    if (result?.error) setError(result.error);
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #1A1A1A 0%, #3D3D3D 100%)" }}>
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🐝</div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Beeative LiveBoard</h1>
          <p className="text-gray-500 text-sm mt-1">เข้าสู่ระบบเจ้าของช่อง</p>
          <div className="mt-2 h-1 w-16 rounded-full mx-auto" style={{ background: "linear-gradient(90deg, #F5D400, #F5A882)" }} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1 text-sm">อีเมล</label>
            <input name="email" type="email" required placeholder="owner@beeative.com"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#F5D400] text-base transition-colors"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1 text-sm">รหัสผ่าน</label>
            <input name="password" type="password" required placeholder="••••••••"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#F5D400] text-base transition-colors"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 rounded-xl p-3 text-center text-sm">{error}</div>
          )}

          <button type="submit" disabled={loading}
            className="w-full h-14 rounded-2xl text-lg font-bold disabled:opacity-50 text-[#1A1A1A] mt-2"
            style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "🐝 เข้าสู่ระบบ"}
          </button>
        </form>

        <div className="text-center mt-6">
          <a href="/" className="text-gray-400 text-sm">← กลับหน้าพนักงาน</a>
        </div>
      </div>
    </main>
  );
}
