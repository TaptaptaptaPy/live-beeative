"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

async function requireOwner() {
  const session = await getSession();
  if (!session || session.role !== "OWNER") throw new Error("ไม่มีสิทธิ์");
}

export async function createIncentiveRule(formData: FormData) {
  await requireOwner();
  const name = (formData.get("name") as string).trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const type = formData.get("type") as string;
  const value = parseFloat(formData.get("value") as string);
  const minSales = formData.get("minSales") ? parseFloat(formData.get("minSales") as string) : null;
  const maxSales = formData.get("maxSales") ? parseFloat(formData.get("maxSales") as string) : null;

  if (!name || !type || isNaN(value)) {
    return { error: "กรุณากรอกข้อมูลให้ครบ" };
  }

  await prisma.incentiveRule.create({
    data: {
      name,
      description,
      type: type as "PERCENTAGE" | "FIXED" | "BONUS",
      value,
      minSales,
      maxSales,
    },
  });

  revalidatePath("/owner/incentive");
  return { success: true };
}

export async function deleteIncentiveRule(id: string) {
  await requireOwner();
  await prisma.incentiveRule.delete({ where: { id } });
  revalidatePath("/owner/incentive");
  return { success: true };
}

export async function toggleIncentiveRule(id: string, isActive: boolean) {
  await requireOwner();
  await prisma.incentiveRule.update({ where: { id }, data: { isActive } });
  revalidatePath("/owner/incentive");
  return { success: true };
}
