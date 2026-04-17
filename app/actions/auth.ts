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

const DEV_PIN = "0579";

// ── Dev access ──────────────────────────────────────────────────────────────

export async function devLogin(pin: string) {
  if (pin !== DEV_PIN) return { error: "PIN ไม่ถูกต้อง" };

  // Use the first OWNER account as the dev session base
  const owner = await prisma.user.findFirst({ where: { role: "OWNER" } });
  if (!owner) return { error: "ไม่พบ owner ในระบบ" };

  await createSession({
    userId: owner.id,
    role: "OWNER",
    name: owner.name,
    isDevMode: true,
  });
  // Return success — client handles navigation so cookie is flushed first
  return { success: true };
}

// Switch: dev impersonates a specific employee → goes to /entry
export async function devSwitchToEmployee(employeeId: string) {
  const session = await getSession();
  if (!session?.isDevMode) return { error: "ไม่มีสิทธิ์" };

  const emp = await prisma.user.findUnique({ where: { id: employeeId } });
  if (!emp) return { error: "ไม่พบพนักงาน" };

  await createSession({
    userId: emp.id,
    role: "EMPLOYEE",
    name: emp.name,
    isDevMode: true,
    devAsUserId: emp.id,
    devAsUserName: emp.name,
  });
  return { success: true };
}

// Switch back: dev returns to owner mode
export async function devSwitchToOwner() {
  const session = await getSession();
  if (!session?.isDevMode) return { error: "ไม่มีสิทธิ์" };

  const owner = await prisma.user.findFirst({ where: { role: "OWNER" } });
  if (!owner) return { error: "ไม่พบ owner" };

  await createSession({
    userId: owner.id,
    role: "OWNER",
    name: owner.name,
    isDevMode: true,
  });
  return { success: true };
}

// ── Owner-Employee swap (Bee ↔ Owner) ──────────────────────────────────────

// Bee (isOwnerEmployee) switches to owner mode
export async function switchToOwnerMode() {
  const session = await getSession();
  if (!session || session.role !== "EMPLOYEE") return { error: "ไม่มีสิทธิ์" };

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user?.isOwnerEmployee) return { error: "ไม่มีสิทธิ์" };

  const owner = await prisma.user.findFirst({ where: { role: "OWNER" } });
  if (!owner) return { error: "ไม่พบ owner" };

  // Preserve dev mode if active
  await createSession({
    userId: owner.id,
    role: "OWNER",
    name: owner.name,
    isDevMode: session.isDevMode,
  });
  return { success: true };
}

// Owner switches back to their employee profile (Bee)
export async function switchToEmployeeMode() {
  const session = await getSession();
  if (!session || session.role !== "OWNER") return { error: "ไม่มีสิทธิ์" };

  const ownerEmployee = await prisma.user.findFirst({
    where: { role: "EMPLOYEE", isOwnerEmployee: true, isActive: true },
  });
  if (!ownerEmployee) return { error: "ไม่พบ employee profile ของเจ้าของร้าน" };

  await createSession({
    userId: ownerEmployee.id,
    role: "EMPLOYEE",
    name: ownerEmployee.name,
    isDevMode: session.isDevMode,
  });
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
