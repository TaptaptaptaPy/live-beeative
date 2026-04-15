"use server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

async function requireOwner() {
  const session = await getSession();
  if (!session || session.role !== "OWNER") return null;
  return session;
}

export async function createBrand(formData: FormData) {
  if (!await requireOwner()) return { error: "ไม่มีสิทธิ์" };
  const name = (formData.get("name") as string)?.trim();
  const commissionRate = parseFloat(formData.get("commissionRate") as string);
  const color = (formData.get("color") as string) || "#F5D400";
  const notes = (formData.get("notes") as string)?.trim() || null;
  if (!name || isNaN(commissionRate)) return { error: "กรุณากรอกข้อมูลให้ครบ" };
  await prisma.brand.create({ data: { name, commissionRate, color, notes } });
  revalidatePath("/owner/brands");
  return { success: true };
}

export async function updateBrand(formData: FormData) {
  if (!await requireOwner()) return { error: "ไม่มีสิทธิ์" };
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const commissionRate = parseFloat(formData.get("commissionRate") as string);
  const color = (formData.get("color") as string) || "#F5D400";
  const notes = (formData.get("notes") as string)?.trim() || null;
  if (!id || !name || isNaN(commissionRate)) return { error: "ข้อมูลไม่ถูกต้อง" };
  await prisma.brand.update({ where: { id }, data: { name, commissionRate, color, notes } });
  revalidatePath("/owner/brands");
  return { success: true };
}

export async function deleteBrand(id: string) {
  if (!await requireOwner()) return { error: "ไม่มีสิทธิ์" };
  await prisma.brand.update({ where: { id }, data: { isActive: false } });
  revalidatePath("/owner/brands");
  return { success: true };
}
