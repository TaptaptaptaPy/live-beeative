"use client";

import { useState, useEffect } from "react";
import { employeeLogin } from "./actions/auth";
import { setFirstPin } from "./actions/employees";
import { useRouter } from "next/navigation";

type Employee = { id: string; name: string; pinSet: boolean; profileImage: string | null };
type Step = "select" | "pin" | "set-pin";

const NUMPAD = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "⌫"],
];

export default function EmployeeHome() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [pin, setPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinPhase, setPinPhase] = useState<"enter" | "confirm">("enter");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("select");

  useEffect(() => {
    fetch("/api/employees").then(r => r.json()).then(setEmployees).catch(() => {});
  }, []);

  function selectEmployee(emp: Employee) {
    setSelected(emp);
    setPin(""); setNewPin(""); setConfirmPin("");
    setError(""); setPinPhase("enter");
    setStep(emp.pinSet ? "pin" : "set-pin");
  }

  function addDigit(digit: string) {
    if (step === "pin") {
      if (pin.length < 4) setPin(p => p + digit);
    } else if (step === "set-pin") {
      if (pinPhase === "enter") {
        if (newPin.length < 4) setNewPin(p => p + digit);
      } else {
        if (confirmPin.length < 4) setConfirmPin(p => p + digit);
      }
    }
  }

  function backspace() {
    if (step === "pin") setPin(p => p.slice(0, -1));
    else if (step === "set-pin") {
      if (pinPhase === "enter") setNewPin(p => p.slice(0, -1));
      else setConfirmPin(p => p.slice(0, -1));
    }
  }

  // Auto-advance when 4 digits entered
  useEffect(() => {
    if (step === "set-pin" && pinPhase === "enter" && newPin.length === 4) {
      setTimeout(() => setPinPhase("confirm"), 200);
    }
  }, [newPin, step, pinPhase]);

  async function submitPin() {
    if (!selected || pin.length !== 4) return;
    setLoading(true); setError("");
    const result = await employeeLogin(selected.id, pin);
    if (result?.error) { setError(result.error); setPin(""); }
    else router.push("/entry");
    setLoading(false);
  }

  async function submitSetPin() {
    if (!selected || confirmPin.length !== 4) return;
    if (newPin !== confirmPin) {
      setError("PIN ไม่ตรงกัน ลองใหม่อีกครั้ง");
      setConfirmPin(""); setNewPin(""); setPinPhase("enter");
      return;
    }
    setLoading(true); setError("");
    const fd = new FormData();
    fd.append("userId", selected.id);
    fd.append("newPin", newPin);
    fd.append("confirmPin", confirmPin);
    const result = await setFirstPin(fd);
    if (result?.error) { setError(result.error); setConfirmPin(""); setNewPin(""); setPinPhase("enter"); }
    else {
      // Auto login
      const loginResult = await employeeLogin(selected.id, newPin);
      if (loginResult?.error) { setError(loginResult.error); setStep("select"); }
      else router.push("/entry");
    }
    setLoading(false);
  }

  // Auto-submit when PIN complete
  useEffect(() => {
    if (step === "pin" && pin.length === 4 && !loading) submitPin();
  }, [pin]);
  useEffect(() => {
    if (step === "set-pin" && pinPhase === "confirm" && confirmPin.length === 4 && !loading) submitSetPin();
  }, [confirmPin]);

  const currentPinDisplay = step === "pin" ? pin :
    pinPhase === "enter" ? newPin : confirmPin;

  // ── Select Screen ──────────────────────────────────────────────────────────

  if (step === "select") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ background: "linear-gradient(135deg, #F5D400 0%, #F5A882 100%)" }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-6xl mb-2">🐝</div>
            <h1 className="text-3xl font-bold text-[#1A1A1A]">Beeative LiveBoard</h1>
            <p className="text-[#1A1A1A]/70 mt-1 font-medium">เลือกชื่อของคุณ</p>
          </div>

          {employees.length === 0 ? (
            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 text-center text-[#1A1A1A]">
              <p className="text-lg">ยังไม่มีพนักงาน</p>
              <p className="text-sm mt-1 text-[#1A1A1A]/60">กรุณาติดต่อเจ้าของร้าน</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {employees.map((emp) => (
                <button key={emp.id} onClick={() => selectEmployee(emp)}
                  className="bg-white rounded-2xl p-4 text-center shadow-lg active:scale-95 transition-transform border-2 border-transparent hover:border-[#F5D400]">
                  <div className="w-16 h-16 rounded-full mx-auto mb-2 overflow-hidden border-2 border-[#F5D400]">
                    {emp.profileImage ? (
                      <img src={emp.profileImage} alt={emp.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#FFF8CC] flex items-center justify-center text-2xl font-bold text-[#1A1A1A]">
                        {emp.name.slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <div className="font-semibold text-[#1A1A1A]">{emp.name}</div>
                  {!emp.pinSet && <div className="text-xs text-orange-500 mt-0.5">ตั้ง PIN ครั้งแรก</div>}
                </button>
              ))}
            </div>
          )}

          <div className="mt-8 text-center">
            <a href="/owner/login" className="text-[#1A1A1A]/60 text-sm underline">🔐 เจ้าของร้าน เข้าสู่ระบบ</a>
          </div>
        </div>
      </main>
    );
  }

  // ── PIN / Set-PIN Screen ────────────────────────────────────────────────────

  const isPinScreen = step === "pin";
  const isSetPin = step === "set-pin";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #F5D400 0%, #F5A882 100%)" }}>
      <div className="w-full max-w-xs">
        <button onClick={() => { setStep("select"); setError(""); }}
          className="text-[#1A1A1A]/70 text-sm mb-6 flex items-center gap-1">
          ← กลับ
        </button>

        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          {/* Profile */}
          <div className="text-center mb-5">
            <div className="w-16 h-16 rounded-full mx-auto mb-2 overflow-hidden border-2 border-[#F5D400]">
              {selected?.profileImage ? (
                <img src={selected.profileImage} alt={selected.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#FFF8CC] flex items-center justify-center text-2xl font-bold text-[#1A1A1A]">
                  {selected?.name.slice(0, 1)}
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold text-[#1A1A1A]">{selected?.name}</h2>
            <p className="text-gray-500 text-sm mt-1">
              {isPinScreen ? "ใส่ PIN 4 หลัก" :
                pinPhase === "enter" ? "🔐 ตั้ง PIN ของคุณ (4 หลัก)" : "✅ ยืนยัน PIN อีกครั้ง"}
            </p>
          </div>

          {/* PIN dots */}
          <div className="flex justify-center gap-3 mb-5">
            {[0, 1, 2, 3].map(i => (
              <div key={i}
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-xl transition-all ${
                  currentPinDisplay.length > i ? "border-[#F5D400] bg-[#F5D400]" : "border-gray-300"
                }`}>
                {currentPinDisplay.length > i ? "●" : ""}
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 rounded-xl p-3 text-center text-sm mb-4">{error}</div>
          )}

          {loading && (
            <div className="text-center text-gray-500 text-sm mb-4">กำลังดำเนินการ...</div>
          )}

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-2">
            {NUMPAD.flat().map((key, i) => (
              <button key={i}
                onClick={() => { if (key === "⌫") backspace(); else if (key !== "") addDigit(key); }}
                disabled={key === "" || loading}
                className={`h-14 rounded-2xl text-xl font-semibold transition-all active:scale-90 ${
                  key === "" ? "opacity-0"
                    : key === "⌫" ? "bg-gray-100 text-gray-600"
                    : "bg-gray-100 text-[#1A1A1A] hover:bg-[#FFF8CC]"
                }`}>
                {key}
              </button>
            ))}
          </div>

          {isSetPin && pinPhase === "confirm" && (
            <button onClick={() => { setPinPhase("enter"); setNewPin(""); setConfirmPin(""); }}
              className="w-full mt-3 text-sm text-gray-400 text-center">
              ← แก้ไข PIN
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
