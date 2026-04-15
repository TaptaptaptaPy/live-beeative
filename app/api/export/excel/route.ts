import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { EXPENSE_CATEGORIES } from "@/lib/expense-utils";
import { PLATFORM_LABELS } from "@/lib/utils";
import * as XLSX from "xlsx";

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

  const wb = XLSX.utils.book_new();

  // Sheet 1: ยอดขาย
  const salesData = entries.map((e) => ({
    วันที่: e.date,
    พนักงาน: e.user.name,
    Platform: PLATFORM_LABELS[e.platform] || e.platform,
    ช่วงเวลา: e.session?.name || `${e.customStart}–${e.customEnd}`,
    ยอดขาย: e.salesAmount,
    หมายเหตุ: e.notes || "",
  }));
  const totalSales = entries.reduce((s, e) => s + e.salesAmount, 0);
  salesData.push({ วันที่: "รวม", พนักงาน: "", Platform: "", ช่วงเวลา: "", ยอดขาย: totalSales, หมายเหตุ: "" });
  const ws1 = XLSX.utils.json_to_sheet(salesData);
  XLSX.utils.book_append_sheet(wb, ws1, "ยอดขาย");

  // Sheet 2: รายจ่าย
  const expenseData = expenses.map((e) => ({
    วันที่: e.date,
    รายการ: e.name,
    หมวดหมู่: EXPENSE_CATEGORIES[e.category]?.label || e.category,
    จำนวนเงิน: e.amount,
    ประจำ: e.isRecurring ? "ใช่" : "",
    หมายเหตุ: e.notes || "",
  }));
  const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
  expenseData.push({ วันที่: "รวม", รายการ: "", หมวดหมู่: "", จำนวนเงิน: totalExp, ประจำ: "", หมายเหตุ: "" });
  const ws2 = XLSX.utils.json_to_sheet(expenseData);
  XLSX.utils.book_append_sheet(wb, ws2, "รายจ่าย");

  // Sheet 3: Incentive พนักงาน
  const empSalesMap: Record<string, number> = {};
  for (const e of entries) empSalesMap[e.userId] = (empSalesMap[e.userId] || 0) + e.salesAmount;
  const incentiveData = employees.filter(e => e.role === "EMPLOYEE").map((emp) => {
    const sales = empSalesMap[emp.id] || 0;
    const incentive = (sales * emp.incentiveRate) / 100;
    return {
      พนักงาน: emp.name,
      ยอดขาย: sales,
      "เงินเดือน (บาท)": emp.salary,
      "อัตรา Incentive (%)": emp.incentiveRate,
      "Incentive (บาท)": incentive,
      "รวมจ่ายทั้งหมด": emp.salary + incentive,
    };
  });
  const ws3 = XLSX.utils.json_to_sheet(incentiveData);
  XLSX.utils.book_append_sheet(wb, ws3, "Incentive พนักงาน");

  // Sheet 4: สรุปการเงิน
  const revenue = entries.reduce((s, e) => s + e.salesAmount, 0);
  const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const summaryData = [
    { รายการ: "รายได้รวม (ยอดขายไลฟ์)", จำนวนเงิน: revenue },
    { รายการ: "รายจ่ายรวม", จำนวนเงิน: expenseTotal },
    { รายการ: "กำไรสุทธิ", จำนวนเงิน: revenue - expenseTotal },
  ];
  const ws4 = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, ws4, "สรุปการเงิน");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Beeative-LiveBoard-${month}.xlsx"`,
    },
  });
}
