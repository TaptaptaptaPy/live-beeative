import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// POST /api/migrate-sessions
// แปลง TimeEntry ทุกรายการที่ผูกกับ sessionId → ใช้ customStart/customEnd แทน
export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "OWNER") {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  }

  // ดึง entry ที่ยังมี sessionId อยู่
  const entries = await prisma.timeEntry.findMany({
    where: { sessionId: { not: null } },
    include: { session: true },
  });

  if (entries.length === 0) {
    return NextResponse.json({ message: "ไม่มีรายการที่ต้องแปลง", migrated: 0 });
  }

  let migrated = 0;
  for (const entry of entries) {
    if (!entry.session) continue;
    await prisma.timeEntry.update({
      where: { id: entry.id },
      data: {
        customStart: entry.customStart ?? entry.session.startTime,
        customEnd:   entry.customEnd   ?? entry.session.endTime,
        sessionId:   null, // ตัดการผูกกับ session เก่าออก
      },
    });
    migrated++;
  }

  return NextResponse.json({ message: `แปลงสำเร็จ ${migrated} รายการ`, migrated });
}

// GET — ดูสถานะ (กี่รายการที่ยังผูกอยู่)
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "OWNER") {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  }
  const count = await prisma.timeEntry.count({ where: { sessionId: { not: null } } });
  return NextResponse.json({ pending: count });
}
