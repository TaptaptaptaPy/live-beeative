export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import OwnerEntryForm from "./OwnerEntryForm";

export default async function OwnerEntryPage() {
  const [employees, brands] = await Promise.all([
    prisma.user.findMany({
      where: { role: "EMPLOYEE", isActive: true, deletedAt: null },
      orderBy: [{ isOwnerEmployee: "desc" }, { name: "asc" }],
      select: { id: true, name: true, isOwnerEmployee: true },
    }),
    prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, commissionRate: true, color: true },
    }),
  ]);

  return (
    <div className="max-w-lg mx-auto">
      <OwnerEntryForm employees={employees} brands={brands} />
    </div>
  );
}
