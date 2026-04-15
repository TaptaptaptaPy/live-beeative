"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

async function requireOwner() {
  const session = await getSession();
  if (!session || session.role !== "OWNER") throw new Error("ไม่มีสิทธิ์");
}

export async function createLiveSession(formData: FormData) {
  await requireOwner();
  const name = (formData.get("name") as string).trim();
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const sortOrder = parseInt(formData.get("sortOrder") as string) || 0;

  if (!name || !startTime || !endTime) {
    return { error: "กรุณากรอกข้อมูลให้ครบ" };
  }

  await prisma.liveSession.create({
    data: { name, startTime, endTime, sortOrder },
  });

  revalidatePath("/owner/sessions");
  return { success: true };
}

export async function updateLiveSession(id: string, formData: FormData) {
  await requireOwner();
  const name = (formData.get("name") as string).trim();
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const isActive = formData.get("isActive") === "true";
  const sortOrder = parseInt(formData.get("sortOrder") as string) || 0;

  await prisma.liveSession.update({
    where: { id },
    data: { name, startTime, endTime, isActive, sortOrder },
  });

  revalidatePath("/owner/sessions");
  return { success: true };
}

export async function deleteLiveSession(id: string) {
  await requireOwner();
  await prisma.liveSession.delete({ where: { id } });
  revalidatePath("/owner/sessions");
  return { success: true };
}
