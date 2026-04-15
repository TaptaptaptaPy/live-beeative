import "server-only";
import { prisma } from "./prisma";

type LogAction =
  | "LOGIN" | "LOGOUT"
  | "ENTRY_CREATE" | "ENTRY_DELETE"
  | "BULK_ENTRY_CREATE"
  | "EXPENSE_CREATE" | "EXPENSE_DELETE"
  | "EMPLOYEE_CREATE" | "EMPLOYEE_UPDATE" | "EMPLOYEE_DELETE"
  | "ENTRY_EDIT"
  | "SESSION_CREATE" | "SESSION_DELETE"
  | "PIN_SET" | "PROFILE_UPDATE"
  | "SCHEDULE_CREATE" | "SCHEDULE_DELETE"
  | "LEAVE_UPDATE" | "TARGET_UPDATE";

type LogRole = "OWNER" | "EMPLOYEE";

export async function logActivity(params: {
  userId?: string;
  userName: string;
  userRole: LogRole;
  action: LogAction;
  details?: string;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: params.userId,
        userName: params.userName,
        userRole: params.userRole,
        action: params.action,
        details: params.details ?? null,
      },
    });
  } catch {
    // ไม่ให้ log error กระทบระบบหลัก
  }
}
