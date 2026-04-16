"use client";

type Row = {
  name: string;
  salary: number;
  incentiveRate: number;
  sales: number;
  incentive: number;
  total: number;
};

export default function PayrollActions({
  month,
  monthLabel,
  rows,
  grandSalary,
  grandIncentive,
  grandTotal,
}: {
  month: string;
  monthLabel: string;
  rows: Row[];
  grandSalary: number;
  grandIncentive: number;
  grandTotal: number;
}) {
  function fmt(n: number) {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      maximumFractionDigits: 0,
    }).format(n);
  }

  function downloadCSV() {
    const headers = ["ชื่อพนักงาน", "ยอดขาย (บาท)", "เงินเดือน (บาท)", "อัตรา Incentive (%)", "Incentive (บาท)", "รวมจ่าย (บาท)"];
    const dataRows = rows.map((r) => [
      r.name,
      r.sales.toFixed(0),
      r.salary.toFixed(0),
      r.incentiveRate.toString(),
      r.incentive.toFixed(0),
      r.total.toFixed(0),
    ]);
    const footer = ["รวมทั้งทีม", "", grandSalary.toFixed(0), "", grandIncentive.toFixed(0), grandTotal.toFixed(0)];

    const csvContent = [
      [`สรุปเงินเดือนประจำ ${monthLabel}`],
      [],
      headers,
      ...dataRows,
      [],
      footer,
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function printPayroll() {
    const win = window.open("", "_blank");
    if (!win) return;

    const rowsHtml = rows
      .map(
        (r) => `
      <tr>
        <td>${r.name}</td>
        <td class="num">${fmt(r.sales)}</td>
        <td class="num">${fmt(r.salary)}</td>
        <td class="num">${r.incentiveRate}%</td>
        <td class="num">${fmt(r.incentive)}</td>
        <td class="num total">${fmt(r.total)}</td>
      </tr>`
      )
      .join("");

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>สรุปเงินเดือน ${monthLabel}</title>
        <style>
          body { font-family: 'Sarabun', sans-serif; margin: 32px; color: #1A1A1A; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          p  { color: #888; font-size: 13px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 14px; }
          th { background: #F5D400; padding: 10px 12px; text-align: left; font-weight: 700; }
          td { padding: 10px 12px; border-bottom: 1px solid #eee; }
          .num { text-align: right; }
          .total { font-weight: 700; font-size: 15px; }
          tfoot tr { background: #FFF8CC; font-weight: 700; }
          tfoot td { border-top: 2px solid #F5D400; font-size: 15px; }
          @media print { body { margin: 16px; } }
        </style>
      </head>
      <body>
        <h1>💵 สรุปจ่ายเงินเดือน</h1>
        <p>ประจำเดือน ${monthLabel} · บริษัท Beeative</p>
        <table>
          <thead>
            <tr>
              <th>ชื่อพนักงาน</th>
              <th style="text-align:right">ยอดขาย</th>
              <th style="text-align:right">เงินเดือน</th>
              <th style="text-align:right">อัตรา Incentive</th>
              <th style="text-align:right">Incentive</th>
              <th style="text-align:right">รวมจ่าย</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
          <tfoot>
            <tr>
              <td>รวมทั้งทีม</td>
              <td></td>
              <td class="num">${fmt(grandSalary)}</td>
              <td></td>
              <td class="num">${fmt(grandIncentive)}</td>
              <td class="num total">${fmt(grandTotal)}</td>
            </tr>
          </tfoot>
        </table>
        <p style="margin-top:40px;font-size:12px;color:#aaa">สร้างโดย Beeative LiveBoard · ${new Date().toLocaleDateString("th-TH")}</p>
      </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 400);
  }

  return (
    <div className="grid grid-cols-2 gap-3 pb-6">
      <button
        onClick={downloadCSV}
        className="flex items-center justify-center gap-2 h-12 bg-green-500 text-white rounded-2xl font-semibold text-sm hover:bg-green-600 active:scale-95 transition-all"
      >
        📊 Export CSV
      </button>
      <button
        onClick={printPayroll}
        className="flex items-center justify-center gap-2 h-12 bg-indigo-500 text-white rounded-2xl font-semibold text-sm hover:bg-indigo-600 active:scale-95 transition-all"
      >
        🖨️ พิมพ์ / PDF
      </button>
    </div>
  );
}
