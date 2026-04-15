"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

async function requireOwner() {
  const session = await getSession();
  if (!session || session.role !== "OWNER") throw new Error("ไม่มีสิทธิ์");
}

export async function createEmployee(formData: FormData) {
  await requireOwner();
  const name = (formData.get("name") as string).trim();
  const pin = (formData.get("pin") as string).trim();
  const incentiveRate = parseFloat(formData.get("incentiveRate") as string);

  if (!name || !pin || pin.length !== 4 || isNaN(incentiveRate)) {
    return { error: "กรุณากรอกข้อมูลให้ครบ (PIN ต้องเป็นตัวเลข 4 หลัก)" };
  }

  await prisma.user.create({
    data: { name, pin, incentiveRate, role: "EMPLOYEE" },
  });

  revalidatePath("/owner/employees");
  return { success: true };
}

export async function updateEmployee(id: string, formData: FormData) {
  await requireOwner();
  const name = (formData.get("name") as string).trim();
  const pin = (formData.get("pin") as string).trim();
  const incentiveRate = parseFloat(formData.get("incentiveRate") as string);
  const isActive = formData.get("isActive") === "true";

  await prisma.user.update({
    where: { id },
    data: { name, pin, incentiveRate, isActive },
  });

  revalidatePath("/owner/employees");
  return { success: true };
}

export async function toggleEmployee(id: string, isActive: boolean) {
  await requireOwner();
  await prisma.user.update({ where: { id }, data: { isActive } });
  revalidatePath("/owner/employees");
  return { success: true };
}
