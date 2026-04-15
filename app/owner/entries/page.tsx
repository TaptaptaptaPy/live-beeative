export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatCurrency, PLATFORM_LABELS } from "@/lib/utils";
import EntriesClient from "./EntriesClient";

export default async function EntriesPage({
  searchParams,
}: {
  searchParams: Promise<{ dateFrom?: string; dateTo?: string; userId?: string; platform?: string }>;
}) {
  const { dateFrom, dateTo, userId, platform } = await searchParams;

  const dateWhere = dateFrom || dateTo
    ? { date: { gte: dateFrom || "2000-01-01", lte: dateTo || "2099-12-31" } }
    : {};

  const [entries, employees] = await Promise.all([
    prisma.timeEntry.findMany({
      where: {
        ...dateWhere,
        ...(userId ? { userId } : {}),
        ...(platform ? { platform: platform as "TIKTOK" | "SHOPEE" | "FACEBOOK" | "OTHER" } : {}),
      },
      include: { user: true, session: true, brand: true },
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
    brandName: e.brand?.name ?? null,
    brandColor: e.brand?.color ?? null,
  }));

  return (
    <EntriesClient
      entries={serializedEntries}
      employees={employees.map(e => ({ id: e.id, name: e.name }))}
      totalSales={totalSales}
      filters={{ dateFrom: dateFrom ?? "", dateTo: dateTo ?? "", userId: userId ?? "", platform: platform ?? "" }}
    />
  );
}
