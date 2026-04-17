"use client";

import { useState } from "react";
import { createEntryAsOwner } from "@/app/actions/entries";
import { todayString } from "@/lib/utils";

type Employee = { id: string; name: string; isOwnerEmployee: boolean };
type Brand = { id: string; name: string; commissionRate: number; color: string };

const TIME_PRESETS = [
  { id: "morning", name: "☀️ เช้า",     startTime: "09:00", endTime: "16:00", sub: "09:00 – 16:00 น." },
  { id: "evening", name: "🌙 เย็น",     startTime: "16:00", endTime: "00:00", sub: "16:00 – 24:00 น." },
  { id: "custom",  name: "⚙️ กำหนดเอง", startTime: "",      endTime: "",      sub: "ระบุเวลาเอง" },
];

const PLATFORMS = [
  { value: "TIKTOK",   label: "TikTok",   emoji: "🎵" },
  { value: "SHOPEE",   label: "Shopee",   emoji: "🛒" },
  { value: "FACEBOOK", label: "Facebook", emoji: "📘" },
  { value: "OTHER",    label: "อื่นๆ",     emoji: "📱" },
];

export default function OwnerEntryForm({
  employees,
  brands,
}: {
  employees: Employee[];
  brands: Brand[];
}) {
  const today = todayString();
  const [targetUserId, setTargetUserId] = useState(employees[0]?.id ?? "");
  const [date, setDate] = useState(today);
  const [selectedPreset, setSelectedPreset] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [platform, setPlatform] = useState("");
  const [salesAmount, setSalesAmount] = useState("");
  const [brandId, setBrandId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const isCustomTime = selectedPreset === "custom";
  const activePreset = TIME_PRESETS.find(p => p.id === selectedPreset);
  const isBackdated = date !== today;
  const selectedEmployee = employees.find(e => e.id === targetUserId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!targetUserId) return setError("กรุณาเลือกพนักงาน");
    if (!platform) return setError("กรุณาเลือก Platform");
    if (!salesAmount || parseFloat(salesAmount) < 0) return setError("กรุณากรอกยอดขาย");
    if (!selectedPreset) return setError("กรุณาเลือกช่วงเวลา");

    setLoading(true);
    setError("");
    const fd = new FormData();
    fd.append("targetUserId", targetUserId);
    fd.append("platform", platform);
    fd.append("salesAmount", salesAmount);
    fd.append("date", date);
    const start = isCustomTime ? customStart : (activePreset?.startTime ?? "");
    const end   = isCustomTime ? customEnd   : (activePreset?.endTime ?? "");
    if (start) fd.append("customStart", start);
    if (end)   fd.append("customEnd", end);
    if (notes) fd.append("notes", notes);
    if (brandId) fd.append("brandId", brandId);

    const result = await createEntryAsOwner(fd);
    if (result?.error) setError(result.error);
    else setSuccess(true);
    setLoading(false);
  }

  function reset() {
    setSelectedPreset(""); setCustomStart(""); setCustomEnd("");
    setPlatform(""); setSalesAmount(""); setNotes("");
    setDate(today); setBrandId(""); setError(""); setSuccess(false);
  }

  if (success) {
    return (
      <div className="p-4 min-h-[60vh] flex items-center justify-center">
        <div className="bg-white rounded-3xl p-8 shadow-xl text-center max-w-sm w-full">
          <div className="text-5xl mb-3">✅</div>
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-1">บันทึกสำเร็จ!</h2>
          <p className="text-gray-500 text-sm mb-4">
            ยอดขายของ <strong>{selectedEmployee?.name}</strong> ถูกบันทึกแล้ว
          </p>
          <div className="bg-gray-50 rounded-2xl p-3 mb-5 text-left text-sm">
            <div className="flex justify-between text-gray-600 mb-1">
              <span>Platform:</span>
              <span className="font-semibold">{PLATFORMS.find(p => p.value === platform)?.label}</span>
            </div>
            <div className="flex justify-between text-gray-600 mb-1">
              <span>วันที่:</span>
              <span className="font-semibold">{date}{isBackdated && <span className="text-orange-500 ml-1">(ย้อนหลัง)</span>}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>ยอดขาย:</span>
              <span className="font-bold text-green-600">฿{parseFloat(salesAmount).toLocaleString("th-TH")}</span>
            </div>
          </div>
          <button onClick={reset}
            className="w-full h-11 rounded-2xl font-semibold text-[#1A1A1A]"
            style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}>
            กรอกยอดใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4 pb-32">

      <div className="pt-2">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">✍️ บันทึกยอดขาย</h1>
        <p className="text-sm text-gray-500 mt-0.5">เจ้าของสามารถบันทึกยอดให้พนักงานคนใดก็ได้</p>
      </div>

      {/* Employee selector */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-[#F5D400]">
        <label className="block text-[#1A1A1A] font-semibold mb-3">👤 บันทึกยอดให้</label>
        <div className="flex gap-2 flex-wrap">
          {employees.map(emp => (
            <button key={emp.id} type="button"
              onClick={() => setTargetUserId(emp.id)}
              className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all flex items-center gap-1.5 ${
                targetUserId === emp.id ? "border-[#F5D400] bg-[#FFF8CC]" : "border-gray-200"
              }`}>
              {emp.name}
              {emp.isOwnerEmployee && <span className="text-[10px] text-[#F5A882]">(เจ้าของ)</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Date */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-[#F5D400]">
        <label className="block text-[#1A1A1A] font-semibold mb-2">
          📅 วันที่{isBackdated && <span className="ml-2 text-sm text-orange-500 font-normal">(ย้อนหลัง)</span>}
        </label>
        <input type="date" value={date} max={today}
          onChange={e => setDate(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-[#F5D400]" />
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
              className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                platform === p.value ? "border-[#F5D400] bg-[#FFF8CC]" : "border-gray-200"
              }`}>
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
          <button type="button" onClick={() => setBrandId("")}
            className={`w-full mb-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
              !brandId ? "border-[#F5D400] bg-[#FFF8CC]" : "border-gray-200"
            }`}>
            <div className="font-semibold text-[#1A1A1A]">📦 ยอดรวม (ไม่แยกแบรนด์)</div>
          </button>
          <div className="flex gap-2 flex-wrap">
            {brands.map(b => (
              <button key={b.id} type="button" onClick={() => setBrandId(b.id)}
                className={`px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all flex items-center gap-1.5 ${
                  brandId === b.id ? "border-[#F5D400] bg-[#FFF8CC]" : "border-gray-200"
                }`}>
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
        {salesAmount && (
          <div className="text-right text-2xl font-bold text-green-600 mt-1">
            ฿{parseFloat(salesAmount).toLocaleString("th-TH")}
          </div>
        )}
        {salesAmount && brandId && (() => {
          const brand = brands.find(b => b.id === brandId);
          if (!brand) return null;
          const commission = parseFloat(salesAmount) * brand.commissionRate / 100;
          return (
            <div className="text-right text-sm text-green-600 mt-1">
              💰 commission ~฿{commission.toLocaleString("th-TH", { maximumFractionDigits: 0 })}
            </div>
          );
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

      {error && (
        <div className="bg-red-50 text-red-600 rounded-2xl p-4 text-center font-medium">{error}</div>
      )}

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t-2 border-[#F5D400] shadow-lg z-10">
        <button type="submit" disabled={loading}
          className="w-full h-14 rounded-2xl text-lg font-bold disabled:opacity-40 active:scale-95 transition-all text-[#1A1A1A] max-w-lg mx-auto block"
          style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}>
          {loading ? "กำลังบันทึก..." : `✅ บันทึกยอดให้ ${selectedEmployee?.name ?? "..."}`}
        </button>
      </div>
    </form>
  );
}
