import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { EXPENSE_CATEGORIES } from "@/lib/expense-utils";
import { PLATFORM_LABELS } from "@/lib/utils";

function fmt(n: number) {
  return new Intl.NumberFormat("th-TH").format(n) + " บาท";
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "OWNER") {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const month = searchParams.get("month") || new Date().toISOString().slice(0, 7);
  const [year, mon] = month.split("-");
  const startDate = `${year}-${mon}-01`;
  const lastDay = new Date(parseInt(year), parseInt(mon), 0).getDate();
  const endDate = `${year}-${mon}-${String(lastDay).padStart(2, "0")}`;

  const [entries, expenses, employees] = await Promise.all([
    prisma.timeEntry.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      include: { user: true, session: true },
      orderBy: { date: "asc" },
    }),
    prisma.expense.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      orderBy: { date: "asc" },
    }),
    prisma.user.findMany({ where: { role: "EMPLOYEE" } }),
  ]);

  const totalRevenue = entries.reduce((s, e) => s + e.salesAmount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const profit = totalRevenue - totalExpenses;
  const monthLabel = new Date(`${month}-01`).toLocaleDateString("th-TH", { year: "numeric", month: "long" });

  const empSalesMap: Record<string, number> = {};
  for (const e of entries) empSalesMap[e.userId] = (empSalesMap[e.userId] || 0) + e.salesAmount;

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<title>Beeative LiveBoard - รายงาน ${monthLabel}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Sarabun', sans-serif; color: #1A1A1A; background: #fff; padding: 32px; font-size: 13px; }
  .header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 3px solid #F5D400; }
  .header h1 { font-size: 24px; font-weight: 700; }
  .header p { color: #666; margin-top: 4px; }
  .badge { display: inline-block; background: linear-gradient(135deg,#F5D400,#F5A882); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 8px; }
  .summary { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 24px; }
  .card { border-radius: 12px; padding: 12px 16px; }
  .card-green { background: #f0fdf4; border-left: 4px solid #22c55e; }
  .card-red { background: #fef2f2; border-left: 4px solid #ef4444; }
  .card-yellow { background: #fefce8; border-left: 4px solid #F5D400; }
  .card .label { font-size: 11px; color: #666; margin-bottom: 4px; }
  .card .value { font-size: 18px; font-weight: 700; }
  h2 { font-size: 15px; font-weight: 700; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 2px solid #F5D400; }
  section { margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #F5D400; color: #1A1A1A; padding: 8px; text-align: left; font-weight: 600; }
  td { padding: 7px 8px; border-bottom: 1px solid #f0f0f0; }
  tr:nth-child(even) { background: #FFFBEB; }
  .total-row { font-weight: 700; background: #FFF8CC !important; }
  .profit { color: ${profit >= 0 ? "#16a34a" : "#dc2626"}; font-weight: 700; }
  @media print { body { padding: 16px; } }
</style>
</head>
<body>
<div class="header">
  <h1>🐝 Beeative LiveBoard</h1>
  <p>รายงานการเงินประจำเดือน</p>
  <div class="badge">${monthLabel}</div>
</div>

<div class="summary">
  <div class="card card-green">
    <div class="label">รายได้รวม</div>
    <div class="value" style="color:#16a34a">${fmt(totalRevenue)}</div>
  </div>
  <div class="card card-red">
    <div class="label">รายจ่ายรวม</div>
    <div class="value" style="color:#dc2626">${fmt(totalExpenses)}</div>
  </div>
  <div class="card card-yellow">
    <div class="label">กำไรสุทธิ</div>
    <div class="value profit">${profit >= 0 ? "+" : ""}${fmt(profit)}</div>
  </div>
</div>

<section>
  <h2>🏆 ยอดขายตามพนักงาน (Leaderboard)</h2>
  <table>
    <tr><th>พนักงาน</th><th>ยอดขาย</th><th>เงินเดือน</th><th>Incentive</th><th>รวมจ่าย</th></tr>
    ${employees.filter(e => e.role === "EMPLOYEE").sort((a,b) => (empSalesMap[b.id]||0)-(empSalesMap[a.id]||0)).map((emp, i) => {
      const sales = empSalesMap[emp.id] || 0;
      const incentive = (sales * emp.incentiveRate) / 100;
      const medals = ["🥇","🥈","🥉"];
      return `<tr><td>${medals[i]||"👤"} ${emp.name}</td><td>${fmt(sales)}</td><td>${fmt(emp.salary)}</td><td>${fmt(incentive)}</td><td>${fmt(emp.salary+incentive)}</td></tr>`;
    }).join("")}
  </table>
</section>

<section>
  <h2>💰 รายจ่าย</h2>
  <table>
    <tr><th>วันที่</th><th>รายการ</th><th>หมวดหมู่</th><th>จำนวนเงิน</th></tr>
    ${expenses.map(e => `<tr><td>${e.date}</td><td>${e.name}</td><td>${EXPENSE_CATEGORIES[e.category]?.emoji} ${EXPENSE_CATEGORIES[e.category]?.label}</td><td>${fmt(e.amount)}</td></tr>`).join("")}
    <tr class="total-row"><td colspan="3">รวมรายจ่าย</td><td>${fmt(totalExpenses)}</td></tr>
  </table>
</section>

<section>
  <h2>📋 รายการยอดขาย</h2>
  <table>
    <tr><th>วันที่</th><th>พนักงาน</th><th>Platform</th><th>ช่วงเวลา</th><th>ยอดขาย</th></tr>
    ${entries.map(e => `<tr><td>${e.date}</td><td>${e.user.name}</td><td>${PLATFORM_LABELS[e.platform]||e.platform}</td><td>${e.session?.name||"กำหนดเอง"}</td><td>${fmt(e.salesAmount)}</td></tr>`).join("")}
    <tr class="total-row"><td colspan="4">รวมยอดขาย</td><td>${fmt(totalRevenue)}</td></tr>
  </table>
</section>

<div style="text-align:center;color:#999;font-size:11px;margin-top:24px;padding-top:12px;border-top:1px solid #eee;">
  สร้างโดย Beeative LiveBoard · ${new Date().toLocaleDateString("th-TH", {year:"numeric",month:"long",day:"numeric"})}
</div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
