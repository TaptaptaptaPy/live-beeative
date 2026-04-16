"use client";

import { useState, useEffect } from "react";

export default function MigrateButton() {
  const [pending, setPending] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/migrate-sessions")
      .then((r) => r.json())
      .then((d) => setPending(d.pending))
      .catch(() => {});
  }, []);

  async function runMigration() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/migrate-sessions", { method: "POST" });
      const data = await res.json();
      setMessage(data.message || "เสร็จแล้ว");
      setPending(0);
      setDone(true);
    } catch {
      setMessage("เกิดข้อผิดพลาด กรุณาลองใหม่");
    }
    setLoading(false);
  }

  if (pending === 0 && !done) return null; // ไม่มีอะไรต้องแปลง

  return (
    <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 space-y-2">
      <div className="font-semibold text-amber-800">🔄 แปลงรายการเก่า</div>
      <p className="text-sm text-amber-700">
        {done
          ? message
          : pending !== null
          ? `มีรายการเก่าที่ใช้ชื่อช่วงเวลา ${pending} รายการ — แปลงให้เป็น ☀️ เช้า / 🌙 เย็น / ⏰ กำหนดเอง`
          : "กำลังตรวจสอบ..."}
      </p>
      {!done && pending !== null && pending > 0 && (
        <button
          onClick={runMigration}
          disabled={loading}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-[#1A1A1A] disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}
        >
          {loading ? "กำลังแปลง..." : `แปลง ${pending} รายการ`}
        </button>
      )}
      {done && (
        <div className="text-sm text-green-700 font-medium">✅ {message}</div>
      )}
    </div>
  );
}
