import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// Convert YYYY-MM-DD + HH:MM to ICS datetime string (local Thai time → UTC)
// Thai time = UTC+7
function toIcsDatetime(date: string, time: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  // Convert Thai (UTC+7) to UTC by subtracting 7 hours
  const utc = new Date(Date.UTC(y, m - 1, d, h - 7, min));
  return utc.toISOString().replace(/[-:]/g, "").replace(".000", "");
}

function escapeIcs(str: string) {
  return str.replace(/[\\;,]/g, "\\$&").replace(/\n/g, "\\n");
}

// ICS for a single event (passed via query params for individual Add to Calendar)
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = req.nextUrl;
  const singleId = searchParams.get("id"); // optional: single event ICS

  const today = new Date().toISOString().slice(0, 10);
  const future = new Date();
  future.setDate(future.getDate() + 30);
  const futureStr = future.toISOString().slice(0, 10);

  const where = singleId
    ? { id: singleId, userId: session.userId }
    : { userId: session.userId, date: { gte: today, lte: futureStr } };

  const schedules = await prisma.workSchedule.findMany({
    where,
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    include: { user: true },
  });

  if (schedules.length === 0) {
    return new NextResponse("ไม่มีตารางที่จะเพิ่ม", { status: 404 });
  }

  const now = new Date().toISOString().replace(/[-:]/g, "").replace(".000", "");

  const events = schedules.map((s, i) => {
    const summary = escapeIcs(s.note ? `🐝 ไลฟ์ — ${s.note}` : `🐝 ตารางไลฟ์`);
    const dtstart = toIcsDatetime(s.date, s.startTime);
    const dtend = toIcsDatetime(s.date, s.endTime);
    const uid = `beeative-${s.id}-${i}@liveboard`;
    return [
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${now}Z`,
      `DTSTART:${dtstart}Z`,
      `DTEND:${dtend}Z`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:Beeative LiveBoard — ${s.user.name}`,
      "END:VEVENT",
    ].join("\r\n");
  }).join("\r\n");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Beeative LiveBoard//TH",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    events,
    "END:VCALENDAR",
  ].join("\r\n");

  const filename = singleId ? "live-schedule.ics" : "my-live-schedule.ics";

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
