"use client";

import { useState, useEffect } from "react";
import { createEntry } from "../actions/entries";
import { logout, switchToOwnerMode } from "../actions/auth";
import { todayString } from "@/lib/utils";
import MyRecentEntries from "./MyRecentEntries";
import MySchedule from "./MySchedule";
import MyStats from "./MyStats";
import DevBanner from "@/app/dev/DevBanner";
import { useRouter } from "next/navigation";

type SessionInfo = { name: string; role: string; profileImage: string | null; isOwnerEmployee?: boolean };
type Brand = { id: string; name: string; commissionRate: number; color: string };

const TIME_PRESETS = [
  { id: "morning", name: "☀️ เช้า",  startTime: "09:00", endTime: "16:00", sub: "09:00 – 16:00 น." },
  { id: "evening", name: "🌙 เย็น",  startTime: "16:00", endTime: "00:00", sub: "16:00 – 24:00 น." },
  { id: "custom",  name: "⚙️ กำหนดเอง", startTime: "",    endTime: "",    sub: "ระบุเวลาเอง" },
];

const PLATFORMS = [
  { value: "TIKTOK",   label: "TikTok",   emoji: "🎵" },
  { value: "SHOPEE",   label: "Shopee",   emoji: "🛒" },
  { value: "FACEBOOK", label: "Facebook", emoji: "📘" },
  { value: "OTHER",    label: "อื่นๆ",     emoji: "📱" },
];


export default function EntryPage() {
  const router = useRouter();
  const [userSession, setUserSession] = useState<SessionInfo | null>(null);
  const [swapping, setSwapping] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandId, setBrandId] = useState("");
  const [date, setDate] = useState(todayString());
  const [selectedPreset, setSelectedPreset] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [platform, setPlatform] = useState("");
  const [salesAmount, setSalesAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(setUserSession).catch(() => {});
    fetch("/api/brands").then(r => r.json()).then(setBrands).catch(() => {});
  }, []);

  const isCustomTime = selectedPreset === "custom";
  const activePreset = TIME_PRESETS.find(p => p.id === selectedPreset);

  const today = todayString();
  const isBackdated = date !== today;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!platform) return setError("กรุณาเลือก Platform");
    if (!salesAmount || parseFloat(salesAmount) < 0) return setError("กรุณากรอกยอดขาย");
    if (!selectedPreset) return setError("กรุณาเลือกช่วงเวลา");

    setLoading(true);
    setError("");
    const fd = new FormData();
    fd.append("platform", platform);
    fd.append("salesAmount", salesAmount);
    fd.append("date", date);
    const start = isCustomTime ? customStart : (activePreset?.startTime ?? "");
    const end   = isCustomTime ? customEnd   : (activePreset?.endTime ?? "");
    if (start) fd.append("customStart", start);
    if (end)   fd.append("customEnd", end);
    if (notes) fd.append("notes", notes);
    if (brandId) fd.append("brandId", brandId);

    const result = await createEntry(fd);
    if (result?.error) setError(result.error);
    else setSuccess(true);
    setLoading(false);
  }

  function resetForm() {
    setSelectedPreset(""); setCustomStart(""); setCustomEnd("");
    setPlatform(""); setSalesAmount(""); setNotes(""); setDate(todayString());
    setBrandId(""); setError(""); setSuccess(false);
  }

  if (success) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
        <div className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-sm w-full">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">บันทึกสำเร็จ!</h2>
          <p className="text-gray-500 mb-6">ยอดขายของคุณถูกบันทึกแล้ว</p>
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Platform:</span>
              <span className="font-semibold">{PLATFORMS.find(p => p.value === platform)?.label}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>วันที่:</span>
              <span className="font-semibold">{date} {isBackdated && <span className="text-orange-500">(ย้อนหลัง)</span>}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>ยอดขาย:</span>
              <span className="font-bold text-green-600 text-lg">฿{parseFloat(salesAmount).toLocaleString("th-TH")}</span>
            </div>
          </div>
          <button onClick={resetForm}
            className="w-full h-12 rounded-2xl font-semibold mb-3 text-[#1A1A1A]"
            style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}>
            กรอกยอดใหม่
          </button>
          <button onClick={() => logout()}
            className="w-full h-12 bg-gray-100 text-gray-600 rounded-2xl font-semibold">
            ออกจากระบบ
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FFFBEB]">
      <DevBanner />
      <div className="px-4 py-4 flex items-center justify-between text-[#1A1A1A]"
        style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}>
        <div className="flex items-center gap-3">
          <a href="/profile" className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#1A1A1A]/20 flex-shrink-0">
            {userSession?.profileImage ? (
              <img src={userSession.profileImage} alt="me" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#1A1A1A]/10 flex items-center justify-center text-lg font-bold">
                {userSession?.name.slice(0, 1) || "?"}
              </div>
            )}
          </a>
          <div>
            <h1 className="text-lg font-bold">🐝 บันทึกยอดขาย</h1>
            <p className="text-[#1A1A1A]/70 text-xs">{userSession?.name || "..."}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {userSession?.isOwnerEmployee && (
            <button
              onClick={async () => {
                setSwapping(true);
                const res = await switchToOwnerMode();
                if (res?.error) { alert(res.error); setSwapping(false); }
                else router.push("/owner/dashboard");
              }}
              disabled={swapping}
              className="text-xs font-semibold border-2 border-[#1A1A1A]/40 rounded-xl px-3 py-1 bg-[#1A1A1A]/10 disabled:opacity-50"
            >
              {swapping ? "..." : "👑 Owner"}
            </button>
          )}
          <button onClick={() => logout()}
            className="text-sm border border-[#1A1A1A]/30 rounded-xl px-3 py-1">
            ออก
          </button>
        </div>
      </div>

      <MyStats />

      <MySchedule />

      <MyRecentEntries />

      <form onSubmit={handleSubmit} className="p-4 space-y-4 max-w-lg mx-auto pb-24">
        {/* Date */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-[#F5D400]">
          <label className="block text-[#1A1A1A] font-semibold mb-2">
            📅 วันที่
            {isBackdated && <span className="ml-2 text-sm text-orange-500 font-normal">(ย้อนหลัง)</span>}
          </label>
          <input type="date" value={date} max={today}
            onChange={e => setDate(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-[#F5D400]"
          />
        </div>

        {/* Session */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-[#F5D400]">
          <label className="block text-[#1A1A1A] font-semibold mb-3">⏰ ช่วงเวลาไลฟ์</label>
          <div className="grid grid-cols-3 gap-2">
            {TIME_PRESETS.map(p => (
              <button key={p.id} type="button"
                onClick={() => setSelectedPreset(p.id)}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  selectedPreset === p.id ? "border-[#F5D400] bg-[#FFF8CC]" : "border-gray-200"
                }`}>
                <div className="font-semibold text-[#1A1A1A] text-sm">{p.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{p.sub}</div>
              </button>
            ))}
          </div>
          {isCustomTime && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-500 mb-1 block">เริ่ม</label>
                <input type="time" value={customStart} onChange={e => setCustomStart(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 focus:outline-none focus:border-[#F5D400]" />
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">สิ้นสุด</label>
                <input type="time" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 focus:outline-none focus:border-[#F5D400]" />
              </div>
            </div>
          )}
        </div>

        {/* Platform */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-[#F5D400]">
          <label className="block text-[#1A1A1A] font-semibold mb-3">📱 Platform</label>
          <div className="grid grid-cols-2 gap-2">
            {PLATFORMS.map(p => (
              <button key={p.value} type="button" onClick={() => setPlatform(p.value)}
                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${platform === p.value ? "border-[#F5D400] bg-[#FFF8CC]" : "border-gray-200"}`}>
                <span className="text-3xl">{p.emoji}</span>
                <span className="font-semibold text-[#1A1A1A]">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Brand */}
        {brands.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-[#F5D400]">
            <label className="block text-[#1A1A1A] font-semibold mb-3">🏷️ แบรนด์ที่ขาย</label>

            {/* ตัวเลือกยอดรวม (ไม่แยกแบรนด์) */}
            <button type="button" onClick={() => setBrandId("")}
              className={`w-full mb-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${!brandId ? "border-[#F5D400] bg-[#FFF8CC]" : "border-gray-200"}`}>
              <div className="font-semibold text-[#1A1A1A]">📦 ยอดรวม (ไม่แยกแบรนด์)</div>
              <div className="text-xs text-gray-400 mt-0.5">ใช้เมื่อขายหลายแบรนด์ในครั้งเดียว หรือไม่ทราบแบรนด์</div>
            </button>

            {/* แบรนด์เฉพาะ */}
            <div className="text-xs text-gray-400 mb-2 font-medium">หรือเลือกแบรนด์เฉพาะ</div>
            <div className="flex gap-2 flex-wrap">
              {brands.map(b => (
                <button key={b.id} type="button" onClick={() => setBrandId(b.id)}
                  className={`px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all flex items-center gap-1.5 ${brandId === b.id ? "border-[#F5D400] bg-[#FFF8CC]" : "border-gray-200"}`}>
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: b.color }} />
                  {b.name}
                  <span className="text-gray-400 text-xs">{b.commissionRate}%</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sales Amount */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-[#F5D400]">
          <label className="block text-[#1A1A1A] font-semibold mb-2">💰 ยอดขาย (บาท)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">฿</span>
            <input type="number" inputMode="numeric" value={salesAmount}
              onChange={e => setSalesAmount(e.target.value)}
              placeholder="0" min="0"
              className="w-full border-2 border-gray-200 rounded-xl pl-9 pr-4 py-4 text-2xl font-bold focus:outline-none focus:border-[#F5D400]"
            />
          </div>
          {salesAmount && <div className="text-right text-2xl font-bold text-green-600 mt-1">฿{parseFloat(salesAmount).toLocaleString("th-TH")}</div>}
          {salesAmount && brandId && (() => {
            const brand = brands.find(b => b.id === brandId);
            if (!brand) return null;
            const commission = parseFloat(salesAmount) * brand.commissionRate / 100;
            return <div className="text-right text-sm text-green-600 mt-1">💰 commission ~฿{commission.toLocaleString("th-TH", { maximumFractionDigits: 0 })}</div>;
          })()}
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-[#F5D400]">
          <label className="block text-[#1A1A1A] font-semibold mb-2">📝 หมายเหตุ (ถ้ามี)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="เช่น ยอดรวม 2 แพลตฟอร์ม, มีโปรโมชั่น..." rows={2}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#F5D400] resize-none"
          />
        </div>

        {error && <div className="bg-red-50 text-red-600 rounded-2xl p-4 text-center font-medium">{error}</div>}

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t-2 border-[#F5D400] shadow-lg">
          <button type="submit" disabled={loading}
            className="w-full h-14 rounded-2xl text-lg font-bold disabled:opacity-40 active:scale-95 transition-all text-[#1A1A1A] max-w-lg mx-auto block"
            style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}>
            {loading ? "กำลังบันทึก..." : "✅ บันทึกยอดขาย"}
          </button>
        </div>
      </form>
    </main>
  );
}
