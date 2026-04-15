import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json([]);

  const today = new Date().toISOString().slice(0, 10);

  const schedules = await prisma.workSchedule.findMany({
    where: { userId: session.userId, date: today },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json(schedules);
}
