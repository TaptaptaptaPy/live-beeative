import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json([]);

  const today = new Date().toISOString().slice(0, 10);
  // Show next 14 days
  const future = new Date();
  future.setDate(future.getDate() + 14);
  const futureStr = future.toISOString().slice(0, 10);

  const schedules = await prisma.workSchedule.findMany({
    where: { userId: session.userId, date: { gte: today, lte: futureStr } },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json(schedules.map(s => ({
    id: s.id,
    date: s.date,
    startTime: s.startTime,
    endTime: s.endTime,
    note: s.note,
  })));
}
