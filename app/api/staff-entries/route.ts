import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "EMPLOYEE") return NextResponse.json([]);

  // เฉพาะ owner-employee เท่านั้น
  const dbUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { isOwnerEmployee: true },
  });
  if (!dbUser?.isOwnerEmployee) return NextResponse.json([]);

  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const entries = await prisma.timeEntry.findMany({
    where: {
      userId: { not: session.userId }, // เฉพาะของพนักงานคนอื่น ไม่ใช่ตัวเอง
      createdAt: { gte: cutoff },
    },
    include: { session: true, user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(
    entries.map(e => ({
      id: e.id,
      date: e.date,
      platform: e.platform,
      salesAmount: e.salesAmount,
      notes: e.notes,
      createdAt: e.createdAt.toISOString(),
      sessionName: e.session?.name ?? null,
      customStart: e.customStart,
      customEnd: e.customEnd,
      userId: e.userId,
      userName: e.user.name,
    }))
  );
}
