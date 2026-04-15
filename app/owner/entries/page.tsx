export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatCurrency, PLATFORM_LABELS } from "@/lib/utils";
import EntriesClient from "./EntriesClient";

export default async function EntriesPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; userId?: string; platform?: string }>;
}) {
  const { date, userId, platform } = await searchParams;

  const [entries, employees] = await Promise.all([
    prisma.timeEntry.findMany({
      where: {
        ...(date ? { date } : {}),
        ...(userId ? { userId } : {}),
        ...(platform ? { platform: platform as "TIKTOK" | "SHOPEE" | "FACEBOOK" | "OTHER" } : {}),
      },
      include: { user: true, session: true },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
    prisma.user.findMany({
      where: { role: "EMPLOYEE", deletedAt: null },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalSales = entries.reduce((s, e) => s + e.salesAmount, 0);

  const serializedEntries = entries.map(e => ({
    id: e.id,
    date: e.date,
    platform: e.platform,
    salesAmount: e.salesAmount,
    notes: e.notes,
    isBackdated: e.isBackdated,
    createdAt: e.createdAt.toISOString(),
    userName: e.user.name,
    sessionName: e.session?.name ?? null,
    customStart: e.customStart,
    customEnd: e.customEnd,
  }));

  return (
    <EntriesClient
      entries={serializedEntries}
      employees={employees.map(e => ({ id: e.id, name: e.name }))}
      totalSales={totalSales}
      filters={{ date: date ?? "", userId: userId ?? "", platform: platform ?? "" }}
    />
  );
}
