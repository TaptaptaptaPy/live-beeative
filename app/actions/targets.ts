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

// ── ตั้งเป้ายอดขาย ─────────────────────────────────────────────────────────

export async function upsertSalesTarget(formData: FormData) {
  const session = await requireOwner();
  if (!session) return { error: "ไม่มีสิทธิ์" };

  const month = formData.get("month") as string; // YYYY-MM
  const userId = (formData.get("userId") as string) || null;
  const amount = parseFloat(formData.get("amount") as string);

  if (!month || isNaN(amount) || amount < 0) return { error: "ข้อมูลไม่ถูกต้อง" };

  // Prisma upsert ไม่รองรับ null ใน unique key — ใช้ findFirst + create/update แทน
  const existing = await prisma.salesTarget.findFirst({ where: { month, userId } });
  if (existing) {
    await prisma.salesTarget.update({ where: { id: existing.id }, data: { amount } });
  } else {
    await prisma.salesTarget.create({ data: { month, userId, amount } });
  }

  await logActivity({
    userId: session.userId, userName: session.name, userRole: session.role,
    action: "TARGET_UPDATE",
    details: JSON.stringify({ month, userId: userId ?? "ทีม", amount }),
  });

  revalidatePath("/owner/targets");
  revalidatePath("/owner/dashboard");
  return { success: true };
}

export async function deleteSalesTarget(id: string) {
  const session = await requireOwner();
  if (!session) return { error: "ไม่มีสิทธิ์" };
  await prisma.salesTarget.delete({ where: { id } });
  revalidatePath("/owner/targets");
  revalidatePath("/owner/dashboard");
  return { success: true };
}

// ── ตั้งงบรายจ่าย ──────────────────────────────────────────────────────────

export async function upsertExpenseBudget(formData: FormData) {
  const session = await requireOwner();
  if (!session) return { error: "ไม่มีสิทธิ์" };

  const month = formData.get("month") as string;
  const amount = parseFloat(formData.get("amount") as string);

  if (!month || isNaN(amount) || amount < 0) return { error: "ข้อมูลไม่ถูกต้อง" };

  await prisma.expenseBudget.upsert({
    where: { month },
    update: { amount },
    create: { month, amount },
  });

  await logActivity({
    userId: session.userId, userName: session.name, userRole: session.role,
    action: "TARGET_UPDATE",
    details: JSON.stringify({ type: "budget", month, amount }),
  });

  revalidatePath("/owner/targets");
  revalidatePath("/owner/finance");
  return { success: true };
}
