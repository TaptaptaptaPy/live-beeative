import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json(null);
  const user = await (await import("@/lib/prisma")).prisma.user.findUnique({
    where: { id: session.userId },
    select: { profileImage: true },
  });
  return NextResponse.json({
    name: session.name,
    role: session.role,
    profileImage: user?.profileImage ?? null,
    isDevMode: session.isDevMode ?? false,
    devAsUserName: session.devAsUserName ?? null,
  });
}
