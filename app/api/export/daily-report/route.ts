import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

// ─── ระบุช่วงเวลาของแต่ละ entry ──────────────────────────────────────────────
type Period = "morning" | "evening" | "other";

function classifyPeriod(customStart: string | null, sessionName: string | null): Period {
  const name = (sessionName || "").toLowerCase();
  if (name.includes("เช้า")) return "morning";
  if (name.includes("เย็น") || name.includes("ค่ำ")) return "evening";

  if (!customStart) return "other";

  const hour = parseInt(customStart.split(":")[0], 10);
  // เช้า  : 06:00 – 13:59
  if (hour >= 6 && hour <= 13) return "morning";
  // เย็น  : 14:00 – 21:59
  if (hour >= 14 && hour <= 21) return "evening";
  return "other";
}

function fmtTime(t: string | null): string {
  if (!t) return "";
  // "00:00" → "24:00" for readability
  return t === "00:00" ? "24:00" : t;
}

export async function POST(req: NextRequest) {
  // Auth guard — owner only
  const session = await getSession();
  if (!session || session.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { startDate, endDate } = await req.json();
  if (!startDate || !endDate) {
    return NextResponse.json({ error: "Missing date range" }, { status: 400 });
  }

  // Fetch all entries in range
  const entries = await prisma.timeEntry.findMany({
    where: { date: { gte: startDate, lte: endDate } },
    include: { user: true, session: true },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });

  // ─── Group by date → period ───────────────────────────────────────────────
  type PeriodData = { names: string[]; amount: number; timeRanges: string[] };
  type DayData = { morning: PeriodData; evening: PeriodData; other: PeriodData };

  const byDate = new Map<string, DayData>();

  for (const e of entries) {
    if (!byDate.has(e.date)) {
      byDate.set(e.date, {
        morning: { names: [], amount: 0, timeRanges: [] },
        evening: { names: [], amount: 0, timeRanges: [] },
        other:   { names: [], amount: 0, timeRanges: [] },
      });
    }
    const day = byDate.get(e.date)!;
    const period = classifyPeriod(e.customStart, e.session?.name ?? null);
    const pd = day[period];

    pd.names.push(e.user.name);
    pd.amount += e.salesAmount;

    if (e.customStart) {
      const range = `${fmtTime(e.customStart)}–${fmtTime(e.customEnd)}`;
      if (!pd.timeRanges.includes(range)) pd.timeRanges.push(range);
    } else if (e.session?.name) {
      if (!pd.timeRanges.includes(e.session.name)) pd.timeRanges.push(e.session.name);
    }
  }

  // ─── Build sheet data ─────────────────────────────────────────────────────
  // Row 0 — merged group headers
  const headerRow1 = ["วันที่", "เช้า", "", "เย็น", "", "อื่นๆ / กำหนดเอง", "", ""];
  // Row 1 — sub-headers
  const headerRow2 = ["", "ชื่อคนลง", "ยอด (บาท)", "ชื่อคนลง", "ยอด (บาท)", "ชื่อคนลง", "ช่วงเวลา", "ยอด (บาท)"];

  const rows: (string | number)[][] = [headerRow1, headerRow2];

  // Fill dates in range even if no entries (leave blank)
  const allDates: string[] = [];
  const cur = new Date(startDate);
  const end = new Date(endDate);
  while (cur <= end) {
    allDates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }

  for (const date of allDates) {
    const day = byDate.get(date);
    if (!day) {
      rows.push([date, "", "", "", "", "", "", ""]);
      continue;
    }

    const { morning, evening, other } = day;

    // Determine how many rows this date needs
    // (max 1 per period in this implementation — combined)
    rows.push([
      date,
      morning.names.join(", ") || "",
      morning.amount > 0 ? morning.amount : "",
      evening.names.join(", ") || "",
      evening.amount > 0 ? evening.amount : "",
      other.names.join(", ") || "",
      other.timeRanges.join(", ") || "",
      other.amount > 0 ? other.amount : "",
    ]);
  }

  // ─── Build xlsx workbook ──────────────────────────────────────────────────
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Merged header cells (row 0 = index 0)
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, // วันที่ spans 2 rows
    { s: { r: 0, c: 1 }, e: { r: 0, c: 2 } }, // เช้า spans 2 cols
    { s: { r: 0, c: 3 }, e: { r: 0, c: 4 } }, // เย็น spans 2 cols
    { s: { r: 0, c: 5 }, e: { r: 0, c: 7 } }, // อื่นๆ spans 3 cols
  ];

  // Column widths
  ws["!cols"] = [
    { wch: 12 }, // date
    { wch: 18 }, // morning name
    { wch: 14 }, // morning amount
    { wch: 18 }, // evening name
    { wch: 14 }, // evening amount
    { wch: 18 }, // other name
    { wch: 16 }, // other time range
    { wch: 14 }, // other amount
  ];

  XLSX.utils.book_append_sheet(wb, ws, "รายงานรายวัน");

  const rawBuf = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;

  const filename = `LiveReport_${startDate}_${endDate}.xlsx`;
  return new NextResponse(rawBuf, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
