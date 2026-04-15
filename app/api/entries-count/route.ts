import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "OWNER") return NextResponse.json({ count: 0 });

  const date = req.nextUrl.searchParams.get("date") || new Date().toISOString().slice(0, 10);
  const count = await prisma.timeEntry.count({ where: { date } });
  return NextResponse.json({ count });
}
