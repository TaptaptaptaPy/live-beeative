import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json([]);

  const { searchParams } = req.nextUrl;
  const sort  = searchParams.get("sort")  ?? "log";   // "log" | "date"
  const scope = searchParams.get("scope") ?? "mine";  // "mine" | "all"

  // scope=all เฉพาะ isOwnerEmployee เท่านั้น
  let allowAll = false;
  if (scope === "all" && session.role === "EMPLOYEE") {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { isOwnerEmployee: true },
    });
    allowAll = dbUser?.isOwnerEmployee ?? false;
  }

  const where = allowAll ? {} : { userId: session.userId };

  const orderBy =
    sort === "date"
      ? [{ date: "desc" as const }, { createdAt: "desc" as const }]
      : [{ createdAt: "desc" as const }];

  const entries = await prisma.timeEntry.findMany({
    where,
    include: {
      session: true,
      user:      { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy,
    take: 200,
  });

  return NextResponse.json(
    entries.map(e => ({
      id:              e.id,
      date:            e.date,
      platform:        e.platform,
      salesAmount:     e.salesAmount,
      notes:           e.notes,
      createdAt:       e.createdAt.toISOString(),
      sessionName:     e.session?.name ?? null,
      customStart:     e.customStart,
      customEnd:       e.customEnd,
      userId:          e.userId,
      userName:        e.user.name,
      createdByUserId: e.createdByUserId,
      createdByName:   e.createdBy?.name ?? null,
    }))
  );
}
