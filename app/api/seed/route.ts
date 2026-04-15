import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST() {
  try {
    const ownerEmail = process.env.OWNER_EMAIL || "owner@yourshop.com";
    const ownerPassword = process.env.OWNER_PASSWORD || "Admin1234!";

    const existing = await prisma.user.findUnique({ where: { email: ownerEmail } });
    if (existing) {
      return NextResponse.json({ message: "ระบบถูก seed แล้ว" });
    }

    const hashedPassword = await bcrypt.hash(ownerPassword, 10);

    // Create owner
    await prisma.user.create({
      data: {
        name: "เจ้าของร้าน",
        role: "OWNER",
        email: ownerEmail,
        password: hashedPassword,
      },
    });

    // Create default live sessions
    await prisma.liveSession.createMany({
      data: [
        { name: "ช่วงเช้า", startTime: "09:00", endTime: "12:00", sortOrder: 1 },
        { name: "ช่วงเย็น", startTime: "17:00", endTime: "21:00", sortOrder: 2 },
        { name: "ช่วงดึก", startTime: "21:00", endTime: "00:00", sortOrder: 3 },
      ],
    });

    // Create sample incentive rule
    await prisma.incentiveRule.create({
      data: {
        name: "ค่า Incentive มาตรฐาน",
        description: "คิด 1% ของยอดขายทั้งหมด",
        type: "PERCENTAGE",
        value: 1.0,
        isActive: true,
        sortOrder: 1,
      },
    });

    return NextResponse.json({
      message: "สร้างข้อมูลเริ่มต้นสำเร็จ",
      ownerEmail,
      defaultPassword: ownerPassword,
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
