"use client";

import { useState } from "react";

type EntryRow = {
  date: string;
  userName: string;
  platform: string;
  salesAmount: number;
  customStart: string | null;
  customEnd: string | null;
};

type Props = {
  entries: EntryRow[];
  days: number;
  dateRange: string;
};

export default function ExportButton({ entries, days, dateRange }: Props) {
  const [open, setOpen] = useState(false);

  function getTimeRange(entry: EntryRow): string {
    if (entry.customStart && entry.customEnd) {
      return `${entry.customStart}–${entry.customEnd}`;
    }
    return "—";
  }

  function downloadCSV() {
    const BOM = "\uFEFF";
    const headers = ["วันที่", "พนักงาน", "Platform", "ช่วงเวลา", "ยอดขาย (฿)"];
    const rows = entries.map((e) => [
      e.date,
      e.userName,
      e.platform,
      getTimeRange(e),
      e.salesAmount.toString(),
    ]);

    const csvContent =
      BOM +
      [headers, ...rows]
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");

    const today = new Date().toISOString().slice(0, 10);
    const filename = `insights-${days}days-${today}.csv`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  }

  function printSummary() {
    // Aggregate by employee
    const empTotals: Record<string, { name: string; count: number; total: number }> = {};
    const platTotals: Record<string, { count: number; total: number }> = {};
    let grandTotal = 0;

    for (const e of entries) {
      if (!empTotals[e.userName]) empTotals[e.userName] = { name: e.userName, count: 0, total: 0 };
      empTotals[e.userName].count++;
      empTotals[e.userName].total += e.salesAmount;

      if (!platTotals[e.platform]) platTotals[e.platform] = { count: 0, total: 0 };
      platTotals[e.platform].count++;
      platTotals[e.platform].total += e.salesAmount;

      grandTotal += e.salesAmount;
    }

    const empRows = Object.values(empTotals)
      .sort((a, b) => b.total - a.total)
      .map(
        (emp) =>
          `<tr><td>${emp.name}</td><td style="text-align:center">${emp.count}</td><td style="text-align:right">฿${emp.total.toLocaleString("th-TH")}</td></tr>`
      )
      .join("");

    const platRows = Object.entries(platTotals)
      .sort(([, a], [, b]) => b.total - a.total)
      .map(
        ([plat, v]) =>
          `<tr><td>${plat}</td><td style="text-align:center">${v.count}</td><td style="text-align:right">฿${v.total.toLocaleString("th-TH")}</td></tr>`
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <title>สรุปยอดขาย — ${dateRange}</title>
  <style>
    body { font-family: 'Sarabun', sans-serif; padding: 32px; color: #1A1A1A; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    p.sub { color: #666; font-size: 13px; margin-bottom: 24px; }
    .grand { font-size: 28px; font-weight: bold; color: #1A1A1A; margin-bottom: 32px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
    th { background: #F5D400; padding: 8px 12px; text-align: left; font-size: 13px; }
    td { padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
    h2 { font-size: 16px; margin-bottom: 8px; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <h1>📊 สรุปยอดขาย</h1>
  <p class="sub">${dateRange} · ${entries.length} รายการ</p>
  <div class="grand">ยอดรวม: ฿${grandTotal.toLocaleString("th-TH")}</div>

  <h2>👤 ยอดขายรายพนักงาน</h2>
  <table>
    <thead><tr><th>พนักงาน</th><th style="text-align:center">ครั้ง</th><th style="text-align:right">ยอดขาย</th></tr></thead>
    <tbody>${empRows}</tbody>
  </table>

  <h2>📱 ยอดขายราย Platform</h2>
  <table>
    <thead><tr><th>Platform</th><th style="text-align:center">ครั้ง</th><th style="text-align:right">ยอดขาย</th></tr></thead>
    <tbody>${platRows}</tbody>
  </table>
</body>
</html>`;

    const popup = window.open("", "_blank", "width=700,height=600");
    if (popup) {
      popup.document.write(html);
      popup.document.close();
      popup.focus();
      setTimeout(() => popup.print(), 400);
    }
    setOpen(false);
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-9 px-4 rounded-xl text-sm font-semibold text-[#1A1A1A] flex items-center gap-1.5"
        style={{ background: "linear-gradient(135deg, #F5D400, #F5A882)" }}
      >
        📥 Export
        <span className="text-xs opacity-70">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 z-20 overflow-hidden">
            <button
              onClick={downloadCSV}
              className="w-full text-left px-4 py-3 text-sm text-[#1A1A1A] hover:bg-[#FFFBEB] transition-colors font-medium"
            >
              📄 CSV รายการทั้งหมด
            </button>
            <div className="border-t border-gray-100" />
            <button
              onClick={printSummary}
              className="w-full text-left px-4 py-3 text-sm text-[#1A1A1A] hover:bg-[#FFFBEB] transition-colors font-medium"
            >
              🖨️ พิมพ์ / PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}
