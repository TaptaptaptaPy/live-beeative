"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function createEntry(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "กรุณาเข้าสู่ระบบ" };

  const platform = formData.get("platform") as string;
  const salesAmount = parseFloat(formData.get("salesAmount") as string);
  const date = formData.get("date") as string;
  const sessionId = formData.get("sessionId") as string || null;
  const customStart = formData.get("customStart") as string || null;
  const customEnd = formData.get("customEnd") as string || null;
  const notes = formData.get("notes") as string || null;

  if (!platform || isNaN(salesAmount) || !date) {
    return { error: "กรุณากรอกข้อมูลให้ครบ" };
  }

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
    },
  });

  revalidatePath("/owner/dashboard");
  revalidatePath("/owner/entries");
  return { success: true };
}

export async function deleteEntry(id: string) {
  const session = await getSession();
  if (!session || session.role !== "OWNER") return { error: "ไม่มีสิทธิ์" };
  await prisma.timeEntry.delete({ where: { id } });
  revalidatePath("/owner/entries");
  return { success: true };
}
