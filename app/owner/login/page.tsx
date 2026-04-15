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
    if (result?.error) {
      setError(result.error);
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔐</div>
          <h1 className="text-2xl font-bold text-gray-800">เจ้าของร้าน</h1>
          <p className="text-gray-500 text-sm mt-1">เข้าสู่ระบบจัดการ</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">อีเมล</label>
            <input
              name="email"
              type="email"
              required
              placeholder="owner@yourshop.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-lg"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">รหัสผ่าน</label>
            <input
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-lg"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 rounded-xl p-3 text-center text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-slate-800 text-white rounded-2xl text-lg font-semibold disabled:opacity-50 mt-2"
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <div className="text-center mt-6">
          <a href="/" className="text-gray-400 text-sm">
            ← กลับหน้าพนักงาน
          </a>
        </div>
      </div>
    </main>
  );
}
