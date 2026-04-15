"use client";

import { updateEmployee, deleteEmployee } from "@/app/actions/employees";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";

type Props = {
  employee: {
    id: string; name: string; salary: number; incentiveRate: number;
    isActive: boolean; pinSet: boolean; profileImage: string; showSalary: boolean;
  };
};

export default function EmployeeEditForm({ employee: emp }: Props) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [previewImg, setPreviewImg] = useState(emp.profileImage || "");
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPreviewImg(result);
      if (imgInputRef.current) imgInputRef.current.value = result;
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess(false);
    const result = await updateEmployee(new FormData(e.currentTarget));
    if (result?.error) setError(result.error);
    else { setSuccess(true); setTimeout(() => setSuccess(false), 3000); }
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100"
        style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}>
        <h2 className="font-bold text-[#1A1A1A]">✏️ แก้ไขข้อมูลพนักงาน</h2>
        <p className="text-xs text-[#1A1A1A]/70 mt-0.5">เจ้าของสามารถแก้ไขข้อมูลทั้งหมดได้</p>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <input type="hidden" name="id" value={emp.id} />
        {/* Hidden image field */}
        <input type="hidden" name="profileImage" ref={imgInputRef} defaultValue={emp.profileImage} />

        {/* Profile image upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">รูปโปรไฟล์</label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#F5D400] flex-shrink-0">
              {previewImg ? (
                <img src={previewImg} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#FFF8CC] flex items-center justify-center text-2xl font-bold text-[#1A1A1A]">
                  {emp.name.slice(0, 1)}
                </div>
              )}
            </div>
            <button type="button" onClick={() => fileRef.current?.click()}
              className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm text-gray-600 hover:border-[#F5D400] transition-all">
              เลือกรูป
            </button>
            {previewImg && (
              <button type="button" onClick={() => { setPreviewImg(""); if (imgInputRef.current) imgInputRef.current.value = ""; }}
                className="text-xs text-red-400 hover:text-red-600">ลบรูป</button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อพนักงาน</label>
          <input name="name" defaultValue={emp.name} required
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm" />
        </div>

        {/* Salary + Incentive */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เงินเดือน (฿)</label>
            <input name="salary" type="number" min="0" defaultValue={emp.salary}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Incentive (%)</label>
            <input name="incentiveRate" type="number" step="0.1" min="0" max="100" defaultValue={emp.incentiveRate}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm" />
          </div>
        </div>

        {/* PIN override */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ตั้ง PIN ใหม่ <span className="text-gray-400 font-normal">(ปล่อยว่าง = ไม่เปลี่ยน)</span>
          </label>
          <input name="pin" type="password" inputMode="numeric" maxLength={4} placeholder="PIN 4 หลัก"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#F5D400] text-sm font-mono tracking-widest" />
          {emp.pinSet && (
            <label className="flex items-center gap-2 mt-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" name="clearPin" value="true" className="rounded" />
              รีเซ็ต PIN (ให้พนักงานตั้งใหม่เอง)
            </label>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
          <div className="flex gap-3">
            {[
              { value: "true", label: "✅ ใช้งานอยู่" },
              { value: "false", label: "⛔ ปิดการใช้งาน" },
            ].map(opt => (
              <label key={opt.value}
                className={`flex-1 text-center p-2 rounded-xl border-2 cursor-pointer text-sm transition-all`}>
                <input type="radio" name="isActive" value={opt.value}
                  defaultChecked={String(emp.isActive) === opt.value}
                  className="sr-only" />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* Show Salary */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">แสดงเงินเดือน/Incentive ให้พนักงานเห็น</label>
          <div className="flex gap-3">
            {[
              { value: "true", label: "👁️ แสดง" },
              { value: "false", label: "🙈 ซ่อน" },
            ].map(opt => (
              <label key={opt.value}
                className={`flex-1 text-center p-2 rounded-xl border-2 cursor-pointer text-sm transition-all`}>
                <input type="radio" name="showSalary" value={opt.value}
                  defaultChecked={String(emp.showSalary) === opt.value}
                  className="sr-only" />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-600 rounded-xl p-3 text-sm">{error}</div>}
        {success && <div className="bg-green-50 text-green-600 rounded-xl p-3 text-sm text-center">✅ บันทึกสำเร็จ!</div>}

        <button type="submit" disabled={loading}
          className="w-full h-11 rounded-xl font-semibold disabled:opacity-40 text-[#1A1A1A] text-sm"
          style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}>
          {loading ? "กำลังบันทึก..." : "💾 บันทึกการเปลี่ยนแปลง"}
        </button>

        {/* Delete employee */}
        <div className="pt-2 border-t border-gray-100">
          <button type="button" disabled={deleting}
            onClick={async () => {
              if (!confirm(`ลบพนักงาน "${emp.name}" ออกจากระบบ?\nข้อมูลยอดขายจะยังคงอยู่ แต่พนักงานจะไม่สามารถเข้าสู่ระบบได้`)) return;
              setDeleting(true);
              await deleteEmployee(emp.id);
              router.push("/owner/employees");
            }}
            className="w-full h-10 rounded-xl text-sm font-semibold text-red-500 border-2 border-red-200 hover:bg-red-50 disabled:opacity-40 transition-all">
            {deleting ? "กำลังลบ..." : "🗑️ ลบพนักงานออกจากระบบ"}
          </button>
          <p className="text-xs text-gray-400 text-center mt-1">ข้อมูลยอดขายเดิมจะยังคงอยู่ในระบบ</p>
        </div>
      </form>
    </div>
  );
}
