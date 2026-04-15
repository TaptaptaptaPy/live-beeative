"use client";

import { useState, useRef, useEffect } from "react";
import { updateOwnProfile } from "@/app/actions/employees";
import { useRouter } from "next/navigation";

const NUMPAD = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "⌫"],
];

export default function ProfilePage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [previewImg, setPreviewImg] = useState("");
  const [imgData, setImgData] = useState("");

  // PIN change state
  const [pinStep, setPinStep] = useState<"new" | "confirm">("new");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then((data) => {
      if (data?.name) setUserName(data.name);
      if (data?.profileImage) { setPreviewImg(data.profileImage); setImgData(data.profileImage); }
    }).catch(() => {});
  }, []);

  function addDigit(digit: string) {
    if (pinStep === "new") {
      if (newPin.length < 4) setNewPin(p => p + digit);
    } else {
      if (confirmPin.length < 4) setConfirmPin(p => p + digit);
    }
  }

  function backspace() {
    if (pinStep === "new") setNewPin(p => p.slice(0, -1));
    else setConfirmPin(p => p.slice(0, -1));
  }

  useEffect(() => {
    if (pinStep === "new" && newPin.length === 4) {
      setTimeout(() => setPinStep("confirm"), 200);
    }
  }, [newPin, pinStep]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPreviewImg(result);
      setImgData(result);
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setLoading(true); setError(""); setSuccess("");
    const fd = new FormData();
    if (newPin && confirmPin) { fd.append("newPin", newPin); fd.append("confirmPin", confirmPin); }
    if (imgData) fd.append("profileImage", imgData);

    const result = await updateOwnProfile(fd);
    if (result?.error) setError(result.error);
    else { setSuccess("บันทึกสำเร็จ!"); setNewPin(""); setConfirmPin(""); setPinStep("new"); }
    setLoading(false);
  }

  const currentPin = pinStep === "new" ? newPin : confirmPin;
  const hasChanges = !!(newPin.length > 0 || imgData !== previewImg || imgData);

  return (
    <main className="min-h-screen bg-[#FFFBEB]">
      {/* Header */}
      <div className="px-4 py-4 flex items-center gap-3 text-[#1A1A1A]"
        style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}>
        <button onClick={() => router.push("/entry")} className="text-2xl leading-none">‹</button>
        <div>
          <h1 className="text-lg font-bold">⚙️ โปรไฟล์ของฉัน</h1>
          <p className="text-xs text-[#1A1A1A]/70">{userName}</p>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-sm mx-auto pb-24">
        {/* Profile image */}
        <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
          <div className="w-24 h-24 rounded-full mx-auto mb-3 overflow-hidden border-4 border-[#F5D400]">
            {previewImg ? (
              <img src={previewImg} alt="profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#FFF8CC] flex items-center justify-center text-4xl font-bold text-[#1A1A1A]">
                {userName.slice(0, 1)}
              </div>
            )}
          </div>
          <button onClick={() => fileRef.current?.click()}
            className="px-5 py-2 border-2 border-[#F5D400] rounded-xl text-sm font-medium text-[#1A1A1A] hover:bg-[#FFF8CC] transition-all">
            📷 เปลี่ยนรูปโปรไฟล์
          </button>
          {previewImg && (
            <button onClick={() => { setPreviewImg(""); setImgData(""); }}
              className="block mx-auto mt-2 text-xs text-red-400">ลบรูป</button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </div>

        {/* PIN change */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-[#1A1A1A] mb-1">🔐 เปลี่ยน PIN</h2>
          <p className="text-xs text-gray-500 mb-4">
            {pinStep === "new" ? "กรอก PIN ใหม่ 4 หลัก" : "✅ ยืนยัน PIN อีกครั้ง"}
          </p>

          <div className="flex justify-center gap-3 mb-4">
            {[0, 1, 2, 3].map(i => (
              <div key={i}
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                  currentPin.length > i ? "border-[#F5D400] bg-[#F5D400]" : "border-gray-300"
                }`}>
                {currentPin.length > i ? "●" : ""}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {NUMPAD.flat().map((key, i) => (
              <button key={i}
                onClick={() => { if (key === "⌫") backspace(); else if (key) addDigit(key); }}
                disabled={key === ""}
                className={`h-12 rounded-xl text-lg font-semibold transition-all active:scale-90 ${
                  key === "" ? "opacity-0"
                    : key === "⌫" ? "bg-gray-100 text-gray-600"
                    : "bg-gray-50 text-[#1A1A1A] hover:bg-[#FFF8CC]"
                }`}>
                {key}
              </button>
            ))}
          </div>

          {pinStep === "confirm" && (
            <button onClick={() => { setPinStep("new"); setNewPin(""); setConfirmPin(""); }}
              className="w-full mt-2 text-xs text-gray-400 text-center">← แก้ไข PIN ใหม่</button>
          )}
          {(newPin.length > 0 || confirmPin.length > 0) && pinStep === "new" && (
            <button onClick={() => { setNewPin(""); setConfirmPin(""); }}
              className="w-full mt-2 text-xs text-red-400 text-center">ยกเลิกเปลี่ยน PIN</button>
          )}
        </div>

        {error && <div className="bg-red-50 text-red-600 rounded-xl p-3 text-sm text-center">{error}</div>}
        {success && <div className="bg-green-50 text-green-600 rounded-xl p-3 text-sm text-center">✅ {success}</div>}
      </div>

      {/* Bottom save button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t-2 border-[#F5D400]">
        <button onClick={handleSave} disabled={loading}
          className="w-full h-12 rounded-xl font-bold disabled:opacity-40 text-[#1A1A1A] max-w-sm mx-auto block"
          style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}>
          {loading ? "กำลังบันทึก..." : "💾 บันทึก"}
        </button>
      </div>
    </main>
  );
}
