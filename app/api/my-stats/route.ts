import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json(null);

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const todayStr = now.toISOString().slice(0, 10);
  const monthStart = `${month}-01`;

  // All employees for ranking
  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE", isActive: true, deletedAt: null },
    select: { id: true, name: true, incentiveRate: true, salary: true, showSalary: true },
  });

  // Monthly entries for all employees (for ranking)
  const allEntries = await prisma.timeEntry.findMany({
    where: { date: { gte: monthStart, lte: todayStr } },
    select: { userId: true, salesAmount: true, date: true },
  });

  // My entries
  const myEntries = allEntries.filter(e => e.userId === session.userId);
  const myMonthSales = myEntries.reduce((s, e) => s + e.salesAmount, 0);
  const myTodaySales = myEntries.filter(e => e.date === todayStr).reduce((s, e) => s + e.salesAmount, 0);

  // Per-employee totals for ranking
  const totals: Record<string, number> = {};
  for (const e of allEntries) {
    totals[e.userId] = (totals[e.userId] || 0) + e.salesAmount;
  }
  const sorted = Object.entries(totals).sort(([, a], [, b]) => b - a);
  const myRank = sorted.findIndex(([id]) => id === session.userId) + 1;

  // My incentive rate
  const me = employees.find(e => e.id === session.userId);
  const myIncentive = me ? (myMonthSales * me.incentiveRate) / 100 : 0;
  const mySalary = me?.salary ?? 0;

  // Sales target for this month (personal or team)
  const [personalTarget, teamTarget] = await Promise.all([
    prisma.salesTarget.findFirst({ where: { period: "MONTHLY", dateKey: month, userId: session.userId } }),
    prisma.salesTarget.findFirst({ where: { period: "MONTHLY", dateKey: month, userId: null } }),
  ]);
  const targetAmount = personalTarget?.amount ?? teamTarget?.amount ?? 0;
  const showSalary = me?.showSalary ?? false;

  return NextResponse.json({
    month,
    myMonthSales,
    myTodaySales,
    myRank: myRank > 0 ? myRank : null,
    totalEmployees: employees.length,
    myIncentive,
    mySalary,
    targetAmount,
    entryCount: myEntries.length,
    showSalary,
  });
}
