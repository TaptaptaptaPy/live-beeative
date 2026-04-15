"use server";

import { prisma } from "@/lib/prisma";
import { createSession, deleteSession, getSession } from "@/lib/session";
import { logActivity } from "@/lib/activity";
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
  await logActivity({ userId: user.id, userName: user.name, userRole: "OWNER", action: "LOGIN" });
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
  await logActivity({ userId: user.id, userName: user.name, userRole: "EMPLOYEE", action: "LOGIN" });
  return { success: true };
}

export async function logout() {
  const session = await getSession();
  if (session) {
    await logActivity({
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
      action: "LOGOUT",
    });
  }
  await deleteSession();
  redirect("/");
}
