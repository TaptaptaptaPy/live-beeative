import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json([]);

  // คืนรายการที่สร้างใน 48 ชั่วโมงที่ผ่านมา (แก้ไขได้เฉพาะใน 24h)
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const entries = await prisma.timeEntry.findMany({
    where: {
      userId: session.userId,
      createdAt: { gte: cutoff },
    },
    include: { session: true },
    orderBy: { createdAt: "desc" },
    take: 20,
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
    }))
  );
}
