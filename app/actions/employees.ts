"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";

async function requireOwner() {
  const session = await getSession();
  if (!session || session.role !== "OWNER") throw new Error("ไม่มีสิทธิ์");
  return session;
}

// ── เจ้าของสร้างพนักงาน (PIN เป็น optional) ─────────────────────────────

export async function createEmployee(formData: FormData) {
  const session = await requireOwner();
  const name = (formData.get("name") as string)?.trim();
  const pin = (formData.get("pin") as string)?.trim() || "";
  const incentiveRate = parseFloat((formData.get("incentiveRate") as string) || "1");
  const salary = parseFloat((formData.get("salary") as string) || "0");

  if (!name) return { error: "กรุณาใส่ชื่อพนักงาน" };
  if (pin && (pin.length !== 4 || !/^\d{4}$/.test(pin))) {
    return { error: "PIN ต้องเป็นตัวเลข 4 หลัก" };
  }

  const employee = await prisma.user.create({
    data: {
      name, incentiveRate, salary, role: "EMPLOYEE",
      pin: pin || null,
      pinSet: !!pin,
    },
  });

  await logActivity({
    userId: session.userId, userName: session.name, userRole: session.role,
    action: "EMPLOYEE_CREATE", details: JSON.stringify({ name }),
  });

  revalidatePath("/owner/employees");
  return { success: true, id: employee.id };
}

// ── เจ้าของแก้ไขข้อมูลพนักงาน ──────────────────────────────────────────────

export async function updateEmployee(formData: FormData) {
  const session = await requireOwner();
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const salary = parseFloat((formData.get("salary") as string) || "0");
  const incentiveRate = parseFloat((formData.get("incentiveRate") as string) || "0");
  const isActive = formData.get("isActive") === "true";
  const pin = (formData.get("pin") as string)?.trim() || "";
  const clearPin = formData.get("clearPin") === "true";
  const profileImage = (formData.get("profileImage") as string) || "";

  if (!id || !name) return { error: "ข้อมูลไม่ครบ" };
  if (pin && (pin.length !== 4 || !/^\d{4}$/.test(pin))) {
    return { error: "PIN ต้องเป็นตัวเลข 4 หลัก" };
  }

  const data: Record<string, unknown> = { name, salary, incentiveRate, isActive };
  if (clearPin) { data.pin = null; data.pinSet = false; }
  else if (pin) { data.pin = pin; data.pinSet = true; }
  if (profileImage) data.profileImage = profileImage;

  await prisma.user.update({ where: { id }, data });

  await logActivity({
    userId: session.userId, userName: session.name, userRole: session.role,
    action: "EMPLOYEE_UPDATE", details: JSON.stringify({ name }),
  });

  revalidatePath("/owner/employees");
  revalidatePath(`/owner/employees/${id}`);
  return { success: true };
}

export async function toggleEmployee(id: string, isActive: boolean) {
  await requireOwner();
  await prisma.user.update({ where: { id }, data: { isActive } });
  revalidatePath("/owner/employees");
  return { success: true };
}

// ── พนักงานตั้ง PIN ครั้งแรก ─────────────────────────────────────────────────

export async function setFirstPin(formData: FormData) {
  const userId = formData.get("userId") as string;
  const newPin = (formData.get("newPin") as string)?.trim();
  const confirmPin = (formData.get("confirmPin") as string)?.trim();

  if (!userId) return { error: "ไม่พบข้อมูลผู้ใช้" };
  if (!newPin || !/^\d{4}$/.test(newPin)) return { error: "PIN ต้องเป็นตัวเลข 4 หลัก" };
  if (newPin !== confirmPin) return { error: "PIN ไม่ตรงกัน กรุณากรอกใหม่" };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "EMPLOYEE") return { error: "ไม่พบพนักงาน" };
  if (user.pinSet) return { error: "ตั้ง PIN แล้ว" };

  await prisma.user.update({ where: { id: userId }, data: { pin: newPin, pinSet: true } });

  await logActivity({
    userId, userName: user.name, userRole: "EMPLOYEE",
    action: "PIN_SET", details: JSON.stringify({ first: true }),
  });

  return { success: true, name: user.name };
}

// ── พนักงานอัปเดตโปรไฟล์ตัวเอง (PIN + รูปภาพ) ─────────────────────────────

export async function updateOwnProfile(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "กรุณาเข้าสู่ระบบ" };

  const newPin = (formData.get("newPin") as string)?.trim();
  const confirmPin = (formData.get("confirmPin") as string)?.trim();
  const profileImage = (formData.get("profileImage") as string) || "";

  const data: Record<string, unknown> = {};

  if (newPin || confirmPin) {
    if (!newPin || !/^\d{4}$/.test(newPin)) return { error: "PIN ต้องเป็นตัวเลข 4 หลัก" };
    if (newPin !== confirmPin) return { error: "PIN ไม่ตรงกัน" };
    data.pin = newPin;
    data.pinSet = true;
  }

  if (profileImage) data.profileImage = profileImage;

  if (Object.keys(data).length === 0) return { error: "ไม่มีข้อมูลที่เปลี่ยนแปลง" };

  await prisma.user.update({ where: { id: session.userId }, data });

  await logActivity({
    userId: session.userId, userName: session.name, userRole: session.role,
    action: "PROFILE_UPDATE", details: JSON.stringify({ updated: Object.keys(data) }),
  });

  revalidatePath("/profile");
  return { success: true };
}

// ── เจ้าของลบพนักงาน (soft delete) ──────────────────────────────────────────

export async function deleteEmployee(id: string) {
  const session = await requireOwner();
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return { error: "ไม่พบพนักงาน" };

  await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });

  await logActivity({
    userId: session.userId, userName: session.name, userRole: session.role,
    action: "EMPLOYEE_DELETE",
    details: JSON.stringify({ name: user.name }),
  });

  revalidatePath("/owner/employees");
  revalidatePath(`/owner/employees/${id}`);
  return { success: true };
}
