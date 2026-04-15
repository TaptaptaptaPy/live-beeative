"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

async function requireOwner() {
  const session = await getSession();
  if (!session || session.role !== "OWNER") throw new Error("ไม่มีสิทธิ์");
}

export async function createExpense(formData: FormData) {
  await requireOwner();
  const name = (formData.get("name") as string).trim();
  const amount = parseFloat(formData.get("amount") as string);
  const category = formData.get("category") as string;
  const date = formData.get("date") as string;
  const notes = (formData.get("notes") as string)?.trim() || null;
  const isRecurring = formData.get("isRecurring") === "true";

  if (!name || isNaN(amount) || !category || !date) {
    return { error: "กรุณากรอกข้อมูลให้ครบ" };
  }

  await prisma.expense.create({
    data: {
      name, amount, date, notes, isRecurring,
      category: category as "SALARY" | "PRODUCT" | "MARKETING" | "RENT" | "UTILITIES" | "EQUIPMENT" | "SHIPPING" | "GIFT" | "OTHER",
    },
  });

  revalidatePath("/owner/finance");
  revalidatePath("/owner/expenses");
  return { success: true };
}

export async function deleteExpense(id: string) {
  await requireOwner();
  await prisma.expense.delete({ where: { id } });
  revalidatePath("/owner/finance");
  revalidatePath("/owner/expenses");
  return { success: true };
}

export async function updateEmployeeSalary(id: string, salary: number) {
  await requireOwner();
  await prisma.user.update({ where: { id }, data: { salary } });
  revalidatePath("/owner/employees");
  revalidatePath("/owner/finance");
  return { success: true };
}
