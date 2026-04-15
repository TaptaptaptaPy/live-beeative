"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";
import type { LeaveType } from "@/app/generated/prisma/client";

async function requireOwner() {
  const session = await getSession();
  if (!session || session.role !== "OWNER") return null;
  return session;
}

// ── ตั้งสิทธิ์ลา ────────────────────────────────────────────────────────────

export async function upsertLeaveEntitlement(formData: FormData) {
  const session = await requireOwner();
  if (!session) return { error: "ไม่มีสิทธิ์" };

  const userId = formData.get("userId") as string;
  const leaveType = formData.get("leaveType") as LeaveType;
  const totalDays = parseFloat(formData.get("totalDays") as string);
  const year = parseInt(formData.get("year") as string);

  if (!userId || !leaveType || isNaN(totalDays) || isNaN(year)) return { error: "ข้อมูลไม่ครบ" };

  await prisma.leaveEntitlement.upsert({
    where: { userId_leaveType_year: { userId, leaveType, year } },
    update: { totalDays },
    create: { userId, leaveType, totalDays, year },
  });

  await logActivity({
    userId: session.userId, userName: session.name, userRole: session.role,
    action: "LEAVE_UPDATE",
    details: JSON.stringify({ userId, leaveType, totalDays, year }),
  });

  revalidatePath("/owner/leave");
  return { success: true };
}

// ── บันทึกการลา ─────────────────────────────────────────────────────────────

export async function createLeaveUsed(formData: FormData) {
  const session = await requireOwner();
  if (!session) return { error: "ไม่มีสิทธิ์" };

  const userId = formData.get("userId") as string;
  const leaveType = formData.get("leaveType") as LeaveType;
  const date = formData.get("date") as string;
  const days = parseFloat(formData.get("days") as string);
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!userId || !leaveType || !date || isNaN(days)) return { error: "ข้อมูลไม่ครบ" };

  await prisma.leaveUsed.create({ data: { userId, leaveType, date, days, notes } });

  await logActivity({
    userId: session.userId, userName: session.name, userRole: session.role,
    action: "LEAVE_UPDATE",
    details: JSON.stringify({ userId, leaveType, date, days }),
  });

  revalidatePath("/owner/leave");
  return { success: true };
}

export async function deleteLeaveUsed(id: string) {
  const session = await requireOwner();
  if (!session) return { error: "ไม่มีสิทธิ์" };
  await prisma.leaveUsed.delete({ where: { id } });
  revalidatePath("/owner/leave");
  return { success: true };
}

// ── เปิด/ปิดให้พนักงานเห็นวันลา ────────────────────────────────────────────

export async function toggleLeaveVisibility(userId: string, show: boolean) {
  const session = await requireOwner();
  if (!session) return { error: "ไม่มีสิทธิ์" };

  await prisma.user.update({ where: { id: userId }, data: { showLeave: show } });

  revalidatePath("/owner/leave");
  return { success: true };
}
