"use client";

import { useState, useTransition } from "react";
import { createBrand, updateBrand, deleteBrand } from "@/app/actions/brands";

type BrandWithStats = {
  id: string;
  name: string;
  commissionRate: number;
  color: string;
  notes: string | null;
  totalSales: number;
  totalCommission: number;
  entryCount: number;
};

function fmt(n: number) {
  return n.toLocaleString("th-TH", { maximumFractionDigits: 0 });
}

function BrandCard({ brand }: { brand: BrandWithStats }) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  async function handleUpdate(fd: FormData) {
    fd.append("id", brand.id);
    setError("");
    startTransition(async () => {
      const result = await updateBrand(fd);
      if (result?.error) setError(result.error);
      else setExpanded(false);
    });
  }

  async function handleDelete() {
    if (!confirm(`ลบแบรนด์ "${brand.name}"?`)) return;
    startTransition(async () => {
      await deleteBrand(brand.id);
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div
        className="p-4 cursor-pointer border-l-4"
        style={{ borderLeftColor: brand.color }}
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: brand.color }} />
            <div>
              <div className="font-bold text-[#1A1A1A]">{brand.name}</div>
              <div className="text-sm text-gray-500">Commission {brand.commissionRate}%</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-green-600">฿{fmt(brand.totalCommission)}</div>
            <div className="text-xs text-gray-400">จาก ฿{fmt(brand.totalSales)} ({brand.entryCount} รายการ)</div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <form action={handleUpdate} className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">ชื่อแบรนด์</label>
              <input name="name" defaultValue={brand.name} required
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#F5D400]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Commission %</label>
                <input name="commissionRate" type="number" defaultValue={brand.commissionRate}
                  min="0" max="100" step="0.1" required
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#F5D400]" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">สี</label>
                <input name="color" type="color" defaultValue={brand.color}
                  className="w-full h-10 border-2 border-gray-200 rounded-xl px-1 py-1 focus:outline-none focus:border-[#F5D400]" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">หมายเหตุ (ถ้ามี)</label>
              <textarea name="notes" defaultValue={brand.notes ?? ""} rows={2}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#F5D400] resize-none" />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <div className="flex gap-2">
              <button type="submit" disabled={isPending}
                className="flex-1 h-10 rounded-xl font-semibold text-sm text-[#1A1A1A] disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}>
                {isPending ? "กำลังบันทึก..." : "บันทึก"}
              </button>
              <button type="button" onClick={handleDelete} disabled={isPending}
                className="px-4 h-10 rounded-xl border-2 border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 disabled:opacity-40">
                ลบ
              </button>
              <button type="button" onClick={() => setExpanded(false)}
                className="px-4 h-10 rounded-xl border-2 border-gray-200 text-gray-500 text-sm">
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function AddBrandForm({ onDone }: { onDone: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  async function handleSubmit(fd: FormData) {
    setError("");
    startTransition(async () => {
      const result = await createBrand(fd);
      if (result?.error) setError(result.error);
      else onDone();
    });
  }

  return (
    <form action={handleSubmit} className="bg-white rounded-2xl p-4 shadow-sm space-y-3 border-l-4 border-[#F5D400]">
      <h3 className="font-bold text-[#1A1A1A]">เพิ่มแบรนด์ใหม่</h3>
      <div>
        <label className="text-xs text-gray-500 block mb-1">ชื่อแบรนด์ *</label>
        <input name="name" required placeholder="เช่น โอวัลติน, มาม่า..."
          className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#F5D400]" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Commission % *</label>
          <input name="commissionRate" type="number" min="0" max="100" step="0.1"
            placeholder="เช่น 12" required
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#F5D400]" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">สี</label>
          <input name="color" type="color" defaultValue="#F5D400"
            className="w-full h-10 border-2 border-gray-200 rounded-xl px-1 py-1 focus:outline-none focus:border-[#F5D400]" />
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500 block mb-1">หมายเหตุ (ถ้ามี)</label>
        <textarea name="notes" rows={2} placeholder="รายละเอียดเพิ่มเติม..."
          className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#F5D400] resize-none" />
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <div className="flex gap-2">
        <button type="submit" disabled={isPending}
          className="flex-1 h-10 rounded-xl font-semibold text-sm text-[#1A1A1A] disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}>
          {isPending ? "กำลังเพิ่ม..." : "เพิ่มแบรนด์"}
        </button>
        <button type="button" onClick={onDone}
          className="px-4 h-10 rounded-xl border-2 border-gray-200 text-gray-500 text-sm">
          ยกเลิก
        </button>
      </div>
    </form>
  );
}

export default function BrandsClient({ brands }: { brands: BrandWithStats[] }) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="space-y-3">
      {!showAdd && (
        <button onClick={() => setShowAdd(true)}
          className="w-full h-12 rounded-2xl font-semibold text-[#1A1A1A] text-sm"
          style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}>
          + เพิ่มแบรนด์ใหม่
        </button>
      )}

      {showAdd && <AddBrandForm onDone={() => setShowAdd(false)} />}

      {brands.length === 0 && !showAdd ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm">
          ยังไม่มีแบรนด์ กดปุ่มด้านบนเพื่อเพิ่ม
        </div>
      ) : (
        brands.map(brand => <BrandCard key={brand.id} brand={brand} />)
      )}
    </div>
  );
}
