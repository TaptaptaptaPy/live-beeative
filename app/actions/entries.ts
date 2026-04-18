"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";

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
  const brandId = (formData.get("brandId") as string) || null;

  if (!platform || isNaN(salesAmount) || !date) {
    return { error: "กรุณากรอกข้อมูลให้ครบ" };
  }

  const today = new Date().toISOString().slice(0, 10);
  const isBackdated = date !== today;

  // ไม่จำกัดการลงย้อนหลังสำหรับพนักงาน

  const liveSession = sessionId
    ? await prisma.liveSession.findUnique({ where: { id: sessionId } })
    : null;

  await prisma.timeEntry.create({
    data: {
      userId: session.userId,
      sessionId: sessionId || null,
      brandId: brandId || null,
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

  // พนักงาน: ตรวจสอบสิทธิ์
  let isOwnerEmp = false;
  if (session.role === "EMPLOYEE") {
    const dbUser = await prisma.user.findUnique({ where: { id: session.userId }, select: { isOwnerEmployee: true } });
    isOwnerEmp = dbUser?.isOwnerEmployee ?? false;
    if (!isOwnerEmp && entry.userId !== session.userId) {
      return { error: "ไม่มีสิทธิ์แก้ไขรายการของคนอื่น" };
    }
  }

  const oldAmount = entry.salesAmount;

  const updateData: Record<string, unknown> = { salesAmount, notes };
  // OWNER หรือ owner-employee สามารถเปลี่ยน platform และวันที่ได้
  if (session.role === "OWNER" || isOwnerEmp) {
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
  if (!session) return { error: "ไม่มีสิทธิ์" };

  const entry = await prisma.timeEntry.findUnique({ where: { id }, include: { user: true } });
  if (!entry) return { error: "ไม่พบรายการ" };

  // OWNER can delete anything; EMPLOYEE can delete own; isOwnerEmployee can delete anyone's
  if (session.role === "EMPLOYEE") {
    if (entry.userId !== session.userId) {
      const dbUser = await prisma.user.findUnique({ where: { id: session.userId }, select: { isOwnerEmployee: true } });
      if (!dbUser?.isOwnerEmployee) return { error: "ไม่มีสิทธิ์ลบรายการของผู้อื่น" };
    }
  } else if (session.role !== "OWNER") {
    return { error: "ไม่มีสิทธิ์" };
  }

  await prisma.timeEntry.delete({ where: { id } });
  await logActivity({
    userId: session.userId,
    userName: session.name,
    userRole: session.role,
    action: "ENTRY_DELETE",
    details: JSON.stringify({ entryId: id, employeeName: entry?.user?.name, amount: entry?.salesAmount }),
  });
  revalidatePath("/entry");
  revalidatePath("/owner/entries");
  revalidatePath("/owner/reports");
  return { success: true };
}

// ── Owner creates entry for any employee ────────────────────────────────────

export async function createEntryAsOwner(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "OWNER") return { error: "ไม่มีสิทธิ์" };

  const targetUserId = formData.get("targetUserId") as string;
  if (!targetUserId) return { error: "กรุณาเลือกพนักงาน" };

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) return { error: "ไม่พบพนักงาน" };

  const platform = formData.get("platform") as string;
  const salesAmount = parseFloat(formData.get("salesAmount") as string);
  const date = formData.get("date") as string;
  const customStart = (formData.get("customStart") as string) || null;
  const customEnd = (formData.get("customEnd") as string) || null;
  const notes = (formData.get("notes") as string) || null;
  const brandId = (formData.get("brandId") as string) || null;

  if (!platform || isNaN(salesAmount) || salesAmount < 0 || !date) {
    return { error: "กรุณากรอกข้อมูลให้ครบ" };
  }

  const today = new Date().toISOString().slice(0, 10);
  const isBackdated = date !== today;

  await prisma.timeEntry.create({
    data: {
      userId: targetUserId,
      createdByUserId: session.userId,   // บันทึกว่าใครเป็นคนกด submit
      brandId: brandId || null,
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
    userRole: "OWNER",
    action: "ENTRY_CREATE",
    details: JSON.stringify({ platform, salesAmount, date, isBackdated, forEmployee: targetUser.name }),
  });

  revalidatePath("/owner/dashboard");
  revalidatePath("/owner/entries");
  revalidatePath("/owner/finance");
  revalidatePath("/owner/reports");
  return { success: true };
}
