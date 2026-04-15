"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";

function isWithin24Hours(dateStr: string): boolean {
  const [y, m, d] = dateStr.split("-").map(Number);
  const entryDate = new Date(y, m - 1, d);
  const now = new Date();
  const diffMs = now.getTime() - entryDate.getTime();
  return diffMs >= 0 && diffMs <= 24 * 60 * 60 * 1000;
}

export async function createEntry(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "กรุณาเข้าสู่ระบบ" };

  const platform = formData.get("platform") as string;
  const salesAmount = parseFloat(formData.get("salesAmount") as string);
  const date = formData.get("date") as string;
  const sessionId = (formData.get("sessionId") as string) || null;
  const customStart = (formData.get("customStart") as string) || null;
  const customEnd = (formData.get("customEnd") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!platform || isNaN(salesAmount) || !date) {
    return { error: "กรุณากรอกข้อมูลให้ครบ" };
  }

  const today = new Date().toISOString().slice(0, 10);
  const isBackdated = date !== today;

  // พนักงานลงย้อนหลังได้แค่ 24 ชั่วโมง
  if (session.role === "EMPLOYEE" && isBackdated) {
    if (!isWithin24Hours(date)) {
      return { error: "พนักงานลงยอดย้อนหลังได้ไม่เกิน 24 ชั่วโมง" };
    }
  }

  const liveSession = sessionId
    ? await prisma.liveSession.findUnique({ where: { id: sessionId } })
    : null;

  await prisma.timeEntry.create({
    data: {
      userId: session.userId,
      sessionId: sessionId || null,
      platform: platform as "TIKTOK" | "SHOPEE" | "FACEBOOK" | "OTHER",
      salesAmount,
      date,
      notes,
      customStart,
      customEnd,
      isBackdated,
    },
  });

  await logActivity({
    userId: session.userId,
    userName: session.name,
    userRole: session.role,
    action: "ENTRY_CREATE",
    details: JSON.stringify({ platform, salesAmount, date, isBackdated, session: liveSession?.name }),
  });

  revalidatePath("/owner/dashboard");
  revalidatePath("/owner/entries");
  revalidatePath("/owner/finance");
  revalidatePath("/owner/reports");
  return { success: true };
}

export async function createBulkEntry(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "OWNER") return { error: "ไม่มีสิทธิ์" };

  const userId = (formData.get("userId") as string) || null;
  const platform = (formData.get("platform") as string) || null;
  const periodType = formData.get("periodType") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const totalSales = parseFloat(formData.get("totalSales") as string);
  const notes = (formData.get("notes") as string) || null;

  if (!periodType || !startDate || !endDate || isNaN(totalSales)) {
    return { error: "กรุณากรอกข้อมูลให้ครบ" };
  }

  await prisma.bulkEntry.create({
    data: {
      userId,
      platform: platform as "TIKTOK" | "SHOPEE" | "FACEBOOK" | "OTHER" | null,
      periodType: periodType as "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "CUSTOM",
      startDate,
      endDate,
      totalSales,
      notes,
      createdById: session.userId,
    },
  });

  await logActivity({
    userId: session.userId,
    userName: session.name,
    userRole: "OWNER",
    action: "BULK_ENTRY_CREATE",
    details: JSON.stringify({ periodType, startDate, endDate, totalSales, userId, platform }),
  });

  revalidatePath("/owner/dashboard");
  revalidatePath("/owner/reports");
  revalidatePath("/owner/finance");
  return { success: true };
}

export async function updateEntry(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "กรุณาเข้าสู่ระบบ" };

  const id = formData.get("id") as string;
  const salesAmount = parseFloat(formData.get("salesAmount") as string);
  const notes = (formData.get("notes") as string) || null;
  // owner can also change platform and date
  const platform = (formData.get("platform") as string) || null;
  const date = (formData.get("date") as string) || null;

  if (!id || isNaN(salesAmount) || salesAmount < 0) return { error: "ยอดขายไม่ถูกต้อง" };

  const entry = await prisma.timeEntry.findUnique({ where: { id }, include: { user: true } });
  if (!entry) return { error: "ไม่พบรายการ" };

  // พนักงาน: แก้ไขได้เฉพาะของตัวเอง และภายใน 24 ชั่วโมงหลังสร้าง
  if (session.role === "EMPLOYEE") {
    if (entry.userId !== session.userId) return { error: "ไม่มีสิทธิ์แก้ไขรายการของคนอื่น" };
    const diffMs = Date.now() - new Date(entry.createdAt).getTime();
    if (diffMs > 24 * 60 * 60 * 1000) return { error: "หมดเวลาแก้ไข (เกิน 24 ชั่วโมง) กรุณาติดต่อเจ้าของช่อง" };
  }

  const oldAmount = entry.salesAmount;

  const updateData: Record<string, unknown> = { salesAmount, notes };
  if (session.role === "OWNER") {
    if (platform) updateData.platform = platform;
    if (date) updateData.date = date;
  }

  await prisma.timeEntry.update({ where: { id }, data: updateData });

  await logActivity({
    userId: session.userId,
    userName: session.name,
    userRole: session.role,
    action: "ENTRY_EDIT",
    details: JSON.stringify({
      entryId: id,
      employeeName: entry.user.name,
      oldAmount,
      newAmount: salesAmount,
      editedBy: session.role,
    }),
  });

  revalidatePath("/owner/entries");
  revalidatePath("/owner/reports");
  revalidatePath("/owner/dashboard");
  revalidatePath("/entry");
  return { success: true };
}

export async function deleteEntry(id: string) {
  const session = await getSession();
  if (!session || session.role !== "OWNER") return { error: "ไม่มีสิทธิ์" };
  const entry = await prisma.timeEntry.findUnique({ where: { id }, include: { user: true } });
  await prisma.timeEntry.delete({ where: { id } });
  await logActivity({
    userId: session.userId,
    userName: session.name,
    userRole: "OWNER",
    action: "ENTRY_DELETE",
    details: JSON.stringify({ entryId: id, employeeName: entry?.user?.name, amount: entry?.salesAmount }),
  });
  revalidatePath("/owner/entries");
  revalidatePath("/owner/reports");
  return { success: true };
}
