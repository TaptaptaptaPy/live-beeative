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
  { id: "morning", name: "☀️ เช้า",      startTime: "09:00", endTime: "16:00", sub: "09:00 – 16:00" },
  { id: "evening", name: "🌙 เย็น",      startTime: "16:00", endTime: "00:00", sub: "16:00 – 24:00" },
  { id: "custom",  name: "⚙️ กำหนดเอง",  startTime: "",      endTime: "",      sub: "ระบุเวลาเอง" },
];

const PLATFORMS = [
  { value: "TIKTOK",   label: "TikTok",   emoji: "🎵", color: "#FF004F" },
  { value: "SHOPEE",   label: "Shopee",   emoji: "🛒", color: "#EE4D2D" },
  { value: "FACEBOOK", label: "Facebook", emoji: "📘", color: "#1877F2" },
  { value: "OTHER",    label: "อื่นๆ",     emoji: "📱", color: "#6B7280" },
];

export default function EntryPage() {
  const router = useRouter();
  const [userSession, setUserSession] = useState<SessionInfo | null>(null);
  const [swapping, setSwapping]       = useState(false);
  const [brands, setBrands]           = useState<Brand[]>([]);
  const [brandId, setBrandId]         = useState("");
  const [date, setDate]               = useState(todayString());
  const [selectedPreset, setSelectedPreset] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd]     = useState("");
  const [platform, setPlatform]       = useState("");
  const [salesAmount, setSalesAmount] = useState("");
  const [notes, setNotes]             = useState("");
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState(false);
  const [loading, setLoading]         = useState(false);

  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(setUserSession).catch(() => {});
    fetch("/api/brands").then(r => r.json()).then(setBrands).catch(() => {});
  }, []);

  const isCustomTime  = selectedPreset === "custom";
  const activePreset  = TIME_PRESETS.find(p => p.id === selectedPreset);
  const today         = todayString();
  const isBackdated   = date !== today;
  const activePlatform = PLATFORMS.find(p => p.value === platform);
  const activeBrand    = brands.find(b => b.id === brandId);
  const commission     = activeBrand && salesAmount
    ? parseFloat(salesAmount) * activeBrand.commissionRate / 100 : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!platform)    return setError("กรุณาเลือก Platform");
    if (!salesAmount || parseFloat(salesAmount) < 0) return setError("กรุณากรอกยอดขาย");
    if (!selectedPreset) return setError("กรุณาเลือกช่วงเวลา");

    setLoading(true); setError("");
    const fd = new FormData();
    fd.append("platform", platform);
    fd.append("salesAmount", salesAmount);
    fd.append("date", date);
    const start = isCustomTime ? customStart : (activePreset?.startTime ?? "");
    const end   = isCustomTime ? customEnd   : (activePreset?.endTime ?? "");
    if (start)  fd.append("customStart", start);
    if (end)    fd.append("customEnd", end);
    if (notes)  fd.append("notes", notes);
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

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-green-500 to-emerald-600">
        <div className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-sm w-full animate-slide-up">
          {/* animated check */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl">
            ✅
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">บันทึกสำเร็จ!</h2>
          <p className="text-gray-400 text-sm mb-6">ยอดขายถูกบันทึกเรียบร้อยแล้ว</p>

          {/* summary card */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Platform</span>
              <span className="font-semibold" style={{ color: activePlatform?.color ?? "#1A1A1A" }}>
                {activePlatform?.emoji} {activePlatform?.label}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">วันที่</span>
              <span className="font-semibold text-gray-800">
                {date}{isBackdated && <span className="text-orange-500 text-xs ml-1">(ย้อนหลัง)</span>}
              </span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between">
              <span className="text-gray-500 text-sm">ยอดขาย</span>
              <span className="font-bold text-green-600 text-xl">
                ฿{parseFloat(salesAmount).toLocaleString("th-TH", { maximumFractionDigits: 0 })}
              </span>
            </div>
            {commission !== null && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Commission ({activeBrand?.commissionRate}%)</span>
                <span className="font-semibold text-green-500">
                  ≈฿{commission.toLocaleString("th-TH", { maximumFractionDigits: 0 })}
                </span>
              </div>
            )}
          </div>

          <button onClick={resetForm}
            className="w-full h-12 rounded-2xl font-semibold mb-3 text-[#1A1A1A]"
            style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}>
            + กรอกยอดใหม่
          </button>
          <button onClick={() => logout()}
            className="w-full h-11 bg-gray-100 text-gray-500 rounded-2xl font-semibold text-sm">
            ออกจากระบบ
          </button>
        </div>
      </main>
    );
  }

  // ── Main form ───────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#FFFBEB]">
      <DevBanner />

      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}>
        <div className="flex items-center gap-3">
          <a href="/profile" className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#1A1A1A]/20 flex-shrink-0">
            {userSession?.profileImage ? (
              <img src={userSession.profileImage} alt="me" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#1A1A1A]/10 flex items-center justify-center text-lg font-bold text-[#1A1A1A]">
                {userSession?.name?.slice(0, 1) ?? "?"}
              </div>
            )}
          </a>
          <div>
            <h1 className="text-lg font-bold text-[#1A1A1A]">🐝 บันทึกยอดขาย</h1>
            <p className="text-[#1A1A1A]/70 text-xs">{userSession?.name ?? "..."}</p>
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
              className="text-xs font-semibold border-2 border-[#1A1A1A]/40 rounded-xl px-3 py-1.5 bg-[#1A1A1A]/10 text-[#1A1A1A] disabled:opacity-50">
              {swapping ? "..." : "👑 Owner"}
            </button>
          )}
          <button onClick={() => logout()}
            className="text-sm border border-[#1A1A1A]/30 rounded-xl px-3 py-1.5 text-[#1A1A1A]">
            ออก
          </button>
        </div>
      </div>

      <MyStats />
      <MySchedule />
      <MyRecentEntries isOwnerEmployee={userSession?.isOwnerEmployee ?? false} />

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 space-y-3 max-w-lg mx-auto pb-32">

        {/* Date */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-[#F5D400]">
          <div className="flex items-center justify-between mb-2">
            <label className="font-semibold text-[#1A1A1A]">📅 วันที่</label>
            {isBackdated && (
              <span className="text-xs text-orange-500 font-medium bg-orange-50 px-2 py-0.5 rounded-full">ย้อนหลัง</span>
            )}
          </div>
          <input type="date" value={date} max={today} onChange={e => setDate(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-[#F5D400] bg-white" />
        </div>

        {/* Session presets */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-[#F5D400]">
          <label className="font-semibold text-[#1A1A1A] mb-3 block">⏰ ช่วงเวลาไลฟ์</label>
          <div className="grid grid-cols-3 gap-2">
            {TIME_PRESETS.map(p => (
              <button key={p.id} type="button" onClick={() => setSelectedPreset(p.id)}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  selectedPreset === p.id
                    ? "border-[#F5D400] bg-[#FFF8CC]"
                    : "border-gray-200 hover:border-gray-300"
                }`}>
                <div className="font-semibold text-[#1A1A1A] text-sm">{p.name}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{p.sub}</div>
              </button>
            ))}
          </div>
          {isCustomTime && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">เริ่ม</label>
                <input type="time" value={customStart} onChange={e => setCustomStart(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 focus:outline-none focus:border-[#F5D400]" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">สิ้นสุด</label>
                <input type="time" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 focus:outline-none focus:border-[#F5D400]" />
              </div>
            </div>
          )}
        </div>

        {/* Platform — large tap targets with brand colors */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-[#F5D400]">
          <label className="font-semibold text-[#1A1A1A] mb-3 block">📱 Platform</label>
          <div className="grid grid-cols-2 gap-2">
            {PLATFORMS.map(p => {
              const isActive = platform === p.value;
              return (
                <button key={p.value} type="button" onClick={() => setPlatform(p.value)}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all ${
                    isActive ? "border-transparent" : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={isActive ? { borderColor: p.color, background: p.color + "12" } : {}}>
                  <span className="text-3xl">{p.emoji}</span>
                  <span className="font-semibold text-sm" style={{ color: isActive ? p.color : "#1A1A1A" }}>
                    {p.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Brand */}
        {brands.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-[#F5D400]">
            <label className="font-semibold text-[#1A1A1A] mb-3 block">🏷️ แบรนด์ที่ขาย</label>
            <button type="button" onClick={() => setBrandId("")}
              className={`w-full mb-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${!brandId ? "border-[#F5D400] bg-[#FFF8CC]" : "border-gray-200 hover:border-gray-300"}`}>
              <div className="font-semibold text-[#1A1A1A] text-sm">📦 ยอดรวม (ไม่แยกแบรนด์)</div>
              <div className="text-[11px] text-gray-400 mt-0.5">ใช้เมื่อขายหลายแบรนด์ หรือไม่ทราบแบรนด์</div>
            </button>
            <div className="text-[11px] text-gray-400 mb-2 font-medium">หรือเลือกแบรนด์เฉพาะ</div>
            <div className="flex gap-2 flex-wrap">
              {brands.map(b => (
                <button key={b.id} type="button" onClick={() => setBrandId(b.id)}
                  className={`px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all flex items-center gap-1.5 ${brandId === b.id ? "border-[#F5D400] bg-[#FFF8CC]" : "border-gray-200 hover:border-gray-300"}`}>
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: b.color }} />
                  {b.name}
                  <span className="text-gray-400 text-xs">{b.commissionRate}%</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sales amount */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-[#F5D400]">
          <label className="font-semibold text-[#1A1A1A] mb-2 block">💰 ยอดขาย (บาท)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">฿</span>
            <input
              type="number" inputMode="numeric" value={salesAmount}
              onChange={e => setSalesAmount(e.target.value)}
              placeholder="0" min="0"
              className="w-full border-2 border-gray-200 rounded-xl pl-9 pr-4 py-4 text-2xl font-bold focus:outline-none focus:border-[#F5D400]"
            />
          </div>
          {salesAmount && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-green-600 font-bold text-lg">
                ฿{parseFloat(salesAmount).toLocaleString("th-TH", { maximumFractionDigits: 0 })}
              </span>
              {commission !== null && (
                <span className="text-sm text-green-500">
                  commission ~฿{commission.toLocaleString("th-TH", { maximumFractionDigits: 0 })}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-[#F5D400]">
          <label className="font-semibold text-[#1A1A1A] mb-2 block">📝 หมายเหตุ (ถ้ามี)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="เช่น ยอดรวม 2 แพลตฟอร์ม, มีโปรโมชั่น..." rows={2}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#F5D400] resize-none text-sm" />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 text-sm font-medium flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}
      </form>

      {/* Sticky submit */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur border-t-2 border-[#F5D400] shadow-lg">
        <button
          type="submit"
          form=""
          onClick={handleSubmit as unknown as React.MouseEventHandler}
          disabled={loading}
          className="w-full h-14 rounded-2xl text-lg font-bold disabled:opacity-40 active:scale-95 transition-all text-[#1A1A1A] max-w-lg mx-auto block"
          style={{ background: loading ? "#E5E7EB" : "linear-gradient(135deg, #F5D400, #F5A882)" }}>
          {loading ? "⏳ กำลังบันทึก..." : "✅ บันทึกยอดขาย"}
        </button>
      </div>
    </main>
  );
}
