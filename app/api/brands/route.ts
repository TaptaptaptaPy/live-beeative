import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json([]);
  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    select: { id: true, name: true, commissionRate: true, color: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(brands);
}
