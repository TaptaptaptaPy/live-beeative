import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint: returns active live sessions
export async function GET() {
  const sessions = await prisma.liveSession.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(sessions);
}
