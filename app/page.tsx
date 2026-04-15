"use client";

import { useState, useEffect } from "react";
import { employeeLogin } from "./actions/auth";
import { useRouter } from "next/navigation";

type Employee = { id: string; name: string };

export default function EmployeeHome() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"select" | "pin">("select");

  useEffect(() => {
    fetch("/api/employees")
      .then((r) => r.json())
      .then(setEmployees)
      .catch(() => {});
  }, []);

  function selectEmployee(emp: Employee) {
    setSelected(emp);
    setPin("");
    setError("");
    setStep("pin");
  }

  function addPin(digit: string) {
    if (pin.length < 4) setPin((p) => p + digit);
  }

  function clearPin() {
    setPin((p) => p.slice(0, -1));
  }

  async function submitPin() {
    if (!selected || pin.length !== 4) return;
    setLoading(true);
    setError("");
    const result = await employeeLogin(selected.id, pin);
    if (result?.error) {
      setError(result.error);
      setPin("");
    } else {
      router.push("/entry");
    }
    setLoading(false);
  }

  const NUMPAD = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["", "0", "⌫"],
  ];

  if (step === "select") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">📺</div>
            <h1 className="text-3xl font-bold text-white">live_beeative</h1>
            <p className="text-indigo-200 mt-1">เลือกชื่อของคุณ</p>
          </div>

          {employees.length === 0 ? (
            <div className="bg-white/20 rounded-2xl p-6 text-center text-white">
              <p className="text-lg">ยังไม่มีพนักงาน</p>
              <p className="text-sm mt-1 text-indigo-200">กรุณาติดต่อเจ้าของร้าน</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {employees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => selectEmployee(emp)}
                  className="bg-white rounded-2xl p-5 text-center shadow-lg active:scale-95 transition-transform"
                >
                  <div className="text-3xl mb-2">👤</div>
                  <div className="font-semibold text-gray-800 text-lg">{emp.name}</div>
                </button>
              ))}
            </div>
          )}

          <div className="mt-8 text-center">
            <a href="/owner/login" className="text-indigo-200 text-sm underline">
              เจ้าของร้าน เข้าสู่ระบบ
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xs">
        <button
          onClick={() => setStep("select")}
          className="text-indigo-200 text-sm mb-6 flex items-center gap-1"
        >
          ← กลับ
        </button>

        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">👤</div>
            <h2 className="text-xl font-bold text-gray-800">{selected?.name}</h2>
            <p className="text-gray-500 text-sm mt-1">ใส่ PIN 4 หลัก</p>
          </div>

          {/* PIN Display */}
          <div className="flex justify-center gap-3 mb-6">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-xl ${
                  pin.length > i
                    ? "bg-indigo-500 border-indigo-500 text-white"
                    : "border-gray-300"
                }`}
              >
                {pin.length > i ? "●" : ""}
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 rounded-xl p-3 text-center text-sm mb-4">
              {error}
            </div>
          )}

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-2">
            {NUMPAD.flat().map((key, i) => (
              <button
                key={i}
                onClick={() => {
                  if (key === "⌫") clearPin();
                  else if (key !== "") addPin(key);
                }}
                disabled={key === ""}
                className={`h-14 rounded-2xl text-xl font-semibold transition-all active:scale-90 ${
                  key === ""
                    ? "opacity-0"
                    : key === "⌫"
                    ? "bg-gray-100 text-gray-600"
                    : "bg-gray-100 text-gray-800 hover:bg-indigo-50"
                }`}
              >
                {key}
              </button>
            ))}
          </div>

          <button
            onClick={submitPin}
            disabled={pin.length !== 4 || loading}
            className="w-full mt-4 h-14 bg-indigo-500 text-white rounded-2xl text-lg font-semibold disabled:opacity-40 active:scale-95 transition-all"
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </div>
      </div>
    </main>
  );
}
