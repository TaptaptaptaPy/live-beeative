import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Period = "morning" | "evening" | "other";

const PLATFORM_LABEL: Record<string, string> = {
  TIKTOK: "TikTok",
  SHOPEE: "Shopee",
  FACEBOOK: "Facebook",
  OTHER: "อื่นๆ",
};

function classifyPeriod(customStart: string | null, sessionName: string | null): Period {
  const name = (sessionName || "").toLowerCase();
  if (name.includes("เช้า")) return "morning";
  if (name.includes("เย็น") || name.includes("ค่ำ")) return "evening";
  if (!customStart) return "other";
  const hour = parseInt(customStart.split(":")[0], 10);
  if (hour >= 6 && hour <= 13) return "morning";
  if (hour >= 14 && hour <= 21) return "evening";
  return "other";
}

function fmtTime(t: string | null | undefined): string {
  if (!t) return "";
  return t === "00:00" ? "24:00" : t;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { startDate, endDate } = await req.json();
  if (!startDate || !endDate) {
    return NextResponse.json({ error: "Missing date range" }, { status: 400 });
  }

  // Fetch entries + live sessions (for configured time labels)
  const [entries, liveSessions] = await Promise.all([
    prisma.timeEntry.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      include: { user: true, session: true },
      orderBy: [{ date: "asc" }, { user: { name: "asc" } }, { createdAt: "asc" }],
    }),
    prisma.liveSession.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  // Build column header labels from system-configured sessions
  const morningSession = liveSessions.find(s => s.name.includes("เช้า"));
  const eveningSession = liveSessions.find(s => s.name.includes("เย็น") || s.name.includes("ค่ำ"));

  const morningLabel = morningSession
    ? `☀️ เช้า (${morningSession.startTime}–${fmtTime(morningSession.endTime)})`
    : "☀️ เช้า (09:00–16:00)";
  const eveningLabel = eveningSession
    ? `🌙 เย็น (${eveningSession.startTime}–${fmtTime(eveningSession.endTime)})`
    : "🌙 เย็น (16:00–24:00)";

  // ─── Collect all dates in range ───────────────────────────────────────────────
  const allDates: string[] = [];
  const cur = new Date(startDate);
  const endD = new Date(endDate);
  while (cur <= endD) {
    allDates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }

  // Group entries by date
  const byDate = new Map<string, typeof entries>();
  for (const e of entries) {
    if (!byDate.has(e.date)) byDate.set(e.date, []);
    byDate.get(e.date)!.push(e);
  }

  // ─── Build sheet rows ──────────────────────────────────────────────────────────
  // Columns (9 total):
  // 0: #  1: วันที่  2: ชื่อ  3: Platform
  // 4: เช้า-ยอด  5: เย็น-ยอด  6: อื่นๆ-ช่วงเวลา  7: อื่นๆ-ยอด  8: รวม(row)

  const COLS = 9;
  type Row = (string | number)[];
  const rows: Row[] = [];

  // Header row 0 — group labels
  rows.push([
    "#", "วันที่", "ชื่อ", "Platform",
    morningLabel, eveningLabel,
    "⚙️ อื่นๆ / กำหนดเอง", "", "รวม",
  ]);
  // Header row 1 — sub-labels
  rows.push(["", "", "", "", "ยอด (บาท)", "ยอด (บาท)", "ช่วงเวลา", "ยอด (บาท)", "(บาท)"]);

  let rowNum = 0; // sequential item number (data rows only)

  // Per-person totals for summary
  const personTotals = new Map<string, { name: string; total: number }>();

  for (const date of allDates) {
    const dayEntries = byDate.get(date);

    if (!dayEntries || dayEntries.length === 0) {
      // Blank row to maintain date continuity
      rows.push(["", date, ...Array(COLS - 2).fill("")]);
      continue;
    }

    for (let i = 0; i < dayEntries.length; i++) {
      const e = dayEntries[i];
      rowNum++;

      const period = classifyPeriod(e.customStart, e.session?.name ?? null);
      const platform = PLATFORM_LABEL[e.platform] ?? e.platform;
      const amount = e.salesAmount;

      // Build time label for อื่นๆ
      let otherTime = "";
      if (period === "other") {
        if (e.customStart) {
          otherTime = `${fmtTime(e.customStart)}–${fmtTime(e.customEnd)}`;
        } else if (e.session?.name) {
          otherTime = e.session.name;
        }
      }

      rows.push([
        rowNum,
        i === 0 ? date : "",        // date shown only on first entry of each day
        e.user.name,
        platform,
        period === "morning" ? amount : "",
        period === "evening" ? amount : "",
        otherTime,
        period === "other"   ? amount : "",
        amount,                      // รวม = same as amount (one entry per row)
      ]);

      // Accumulate per-person total
      if (!personTotals.has(e.userId)) {
        personTotals.set(e.userId, { name: e.user.name, total: 0 });
      }
      personTotals.get(e.userId)!.total += amount;
    }
  }

  // ─── Summary section ──────────────────────────────────────────────────────────
  rows.push(Array(COLS).fill(""));
  const summaryIdx = rows.length;
  rows.push(["สรุปรายบุคคล", ...Array(COLS - 1).fill("")]);

  const sortedPeople = [...personTotals.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "th")
  );
  let grandTotal = 0;
  for (const p of sortedPeople) {
    rows.push(["", p.name, "", "", "", "", "", "", p.total]);
    grandTotal += p.total;
  }

  rows.push(Array(COLS).fill(""));
  const grandIdx = rows.length;
  rows.push(["ยอดรวมทั้งหมด", ...Array(COLS - 2).fill(""), grandTotal]);

  // ─── Build workbook ───────────────────────────────────────────────────────────
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);

  ws["!merges"] = [
    // Header row 0 — span 2 header rows for single-sub columns
    { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, // #
    { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } }, // วันที่
    { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } }, // ชื่อ
    { s: { r: 0, c: 3 }, e: { r: 1, c: 3 } }, // Platform
    { s: { r: 0, c: 4 }, e: { r: 1, c: 4 } }, // เช้า
    { s: { r: 0, c: 5 }, e: { r: 1, c: 5 } }, // เย็น
    { s: { r: 0, c: 6 }, e: { r: 0, c: 7 } }, // อื่นๆ spans 2 cols
    { s: { r: 0, c: 8 }, e: { r: 1, c: 8 } }, // รวม
    // Summary rows
    { s: { r: summaryIdx, c: 0 }, e: { r: summaryIdx, c: COLS - 1 } },
    { s: { r: grandIdx,   c: 0 }, e: { r: grandIdx,   c: COLS - 2 } },
  ];

  ws["!cols"] = [
    { wch: 5  }, // #
    { wch: 13 }, // date
    { wch: 16 }, // name
    { wch: 10 }, // platform
    { wch: 18 }, // morning
    { wch: 18 }, // evening
    { wch: 16 }, // other time
    { wch: 14 }, // other amount
    { wch: 14 }, // row total
  ];

  ws["!rows"] = [{ hpt: 22 }, { hpt: 16 }];

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
