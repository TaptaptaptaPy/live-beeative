"use server";

import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export async function ownerLogin(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== "OWNER" || !user.password) {
    return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
  }

  await createSession({ userId: user.id, role: "OWNER", name: user.name });
  redirect("/owner/dashboard");
}

export async function employeeLogin(userId: string, pin: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive || user.role !== "EMPLOYEE" || !user.pin) {
    return { error: "ไม่พบพนักงาน" };
  }
  if (user.pin !== pin) {
    return { error: "PIN ไม่ถูกต้อง" };
  }
  await createSession({ userId: user.id, role: "EMPLOYEE", name: user.name });
  return { success: true };
}

export async function logout() {
  await deleteSession();
  redirect("/");
}
