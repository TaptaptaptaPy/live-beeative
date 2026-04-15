import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint: returns active employees (name + id only, no PIN)
export async function GET() {
  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE", isActive: true },
    select: { id: true, name: true, pinSet: true, profileImage: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(employees);
}
