"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";

async function requireOwner() {
  const session = await getSession();
  if (!session || session.role !== "OWNER") return null;
  return session;
}

export async function createWorkSchedule(formData: FormData) {
  const session = await requireOwner();
  if (!session) return { error: "ไม่มีสิทธิ์" };

  const userId = formData.get("userId") as string;
  const date = formData.get("date") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const note = (formData.get("note") as string)?.trim() || null;

  if (!userId || !date || !startTime || !endTime) return { error: "กรุณากรอกข้อมูลให้ครบ" };

  await prisma.workSchedule.create({ data: { userId, date, startTime, endTime, note } });

  await logActivity({
    userId: session.userId, userName: session.name, userRole: session.role,
    action: "SCHEDULE_CREATE",
    details: JSON.stringify({ date, startTime, endTime }),
  });

  revalidatePath("/owner/schedule");
  return { success: true };
}

export async function deleteWorkSchedule(id: string) {
  const session = await requireOwner();
  if (!session) return { error: "ไม่มีสิทธิ์" };

  await prisma.workSchedule.delete({ where: { id } });

  await logActivity({
    userId: session.userId, userName: session.name, userRole: session.role,
    action: "SCHEDULE_DELETE", details: JSON.stringify({ id }),
  });

  revalidatePath("/owner/schedule");
  return { success: true };
}
