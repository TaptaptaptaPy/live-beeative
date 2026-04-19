// ─────────────────────────────────────────────────────────────────────────────
// APP VERSION — อัปเดตทุกครั้งที่มีการแก้ไข
// ─────────────────────────────────────────────────────────────────────────────

export const APP_VERSION = "1.14.6";
export const APP_VERSION_DATE = "2026-04-19";

export type VersionEntry = {
  version: string;
  date: string;
  title: string;
  changes: string[];
  type: "major" | "minor" | "patch";
};

export const CHANGELOG: VersionEntry[] = [
  {
    version: "1.14.6",
    date: "2026-04-19",
    type: "patch",
    title: "เปลี่ยนสี TikTok เป็น Brand Black",
    changes: [
      "สี TikTok เปลี่ยนจากแดง (#FF004F) → ดำ (#010101) ตาม brand color จริง",
      "ครอบคลุมทุกจุด: PlatformBadge, Dashboard chart, Entry form, Entries list, CSS token",
    ],
  },
  {
    version: "1.14.5",
    date: "2026-04-19",
    type: "minor",
    title: "Platform Badge ครบทุกหน้า + Scroll Indicator + Empty States",
    changes: [
      "Platform badge แสดงครบทุกหน้าใน owner section",
      "Scroll indicator สำหรับ list ที่ยาว",
      "Empty states ครบทุก section",
    ],
  },
  {
    version: "1.14.4",
    date: "2026-04-19",
    type: "minor",
    title: "Dark Mode ครบทุกหน้า + Loading Skeletons",
    changes: [
      "Dark mode ครบ 100%: Finance, Brands, Reports, Insights, Schedule (owner)",
      "Staff page (Entry Form) รองรับ dark mode ทุกส่วน — cards, inputs, sticky footer",
      "Loading skeleton สำหรับทุกหน้าที่เหลือ (9 หน้า): Finance / Brands / Reports / Insights / Schedule / Payroll / Employees / Targets / Logs",
      "ปรับ shadow-sm → border เพื่อ dark mode ที่สมบูรณ์กว่าเดิม",
    ],
  },
  {
    version: "1.14.3",
    date: "2026-04-19",
    type: "minor",
    title: "Pack C Phase 4 — Sidebar + Skeletons",
    changes: [
      "Desktop sidebar navigation (md+) แทน bottom nav — แบ่งเป็น 3 กลุ่ม: Primary / จัดการ / การเงิน",
      "Mobile ยังคงใช้ bottom nav เดิม (ไม่เปลี่ยน)",
      "Loading skeleton สำหรับ Dashboard และ Entries — ระหว่างรอโหลด server data",
      "Layout 2-column grid บน desktop สำหรับ Dashboard และ Entries",
    ],
  },
  {
    version: "1.14.2",
    date: "2026-04-19",
    type: "minor",
    title: "Pack C Phase 3 — Entry & List Pages",
    changes: [
      "Platform badge สีตาม brand จริง (TikTok แดง / Shopee ส้ม / Facebook น้ำเงิน) ทุกหน้า",
      "MyRecentEntries: group header แสดงยอดรวมรายวัน, skeleton loader, dark mode ครบ",
      "Owner Entries: entry card มี left-border สีตาม platform, dark mode ทุกส่วน",
      "EmptyState แยกกรณี 'ยังไม่มีรายการ' vs 'กรองแล้วไม่เจอ' + ปุ่มล้าง filter",
      "Entry form: platform selector ใช้สี brand จริง, success screen แสดง commission",
    ],
  },
  {
    version: "1.14.1",
    date: "2026-04-19",
    type: "minor",
    title: "Pack C Phase 2 — Dashboard Revamp",
    changes: [
      "Dashboard 2-column responsive บน desktop (md+)",
      "Target progress bar — ดึงเป้าทีมเดือนนี้มาแสดง MTD vs เป้า",
      "DashboardCharts dark mode สมบูรณ์ — custom tooltip, สีตาม platform brand",
      "Platform donut chart เป็นแบบ inner radius + legend + mini progress bar",
      "Platform breakdown แต่ละ entry มี progress bar สีตาม brand (TikTok/Shopee/Facebook)",
    ],
  },
  {
    version: "1.14.0",
    date: "2026-04-18",
    type: "minor",
    title: "Pack C Phase 1 — Design System + Dark Mode",
    changes: [
      "Dark mode toggle 🌙/☀️ ในหน้า Owner — กดสลับได้ทันที",
      "Design tokens ครบชุด: semantic colors (success/warning/danger/info), platform colors (TikTok/Shopee/Facebook)",
      "UI primitives ใหม่: StatCard (พร้อม sparkline), Badge, EmptyState, Skeleton",
      "Dashboard cards อัปเดตเป็น StatCard พร้อม sparkline 7 วัน",
      "Gradient progress bar ทีม 1 = gold, 2 = silver, 3 = bronze",
      "Scroll bar เล็กลง, focus ring เป็น bee-yellow",
    ],
  },
  {
    version: "1.13.0",
    date: "2026-04-18",
    type: "minor",
    title: "Entry Log — ดูรายการทั้งหมด + 2 มุมมอง",
    changes: [
      "ช่อง 'รายการที่บันทึกไว้' แสดงได้ทุกรายการ ไม่จำกัด 48 ชม. แล้ว",
      "มุมมอง 🕐 Log — เรียงตามเวลาที่บันทึกเข้ามา แสดงเป็น timeline แยกตามวัน",
      "มุมมอง 📅 วันที่ยอด — เรียงตามวันที่ยอดนั้นเกิดขึ้น เวลาบันทึกอยู่ด้านขวา",
      "แสดงชื่อชัดเจนเมื่อ 'บันทึกแทน' ระบุว่าใครบันทึกให้ใคร",
      "Bee (เจ้าของร้าน) สลับ toggle 'ของฉัน / ทั้งหมด' เพื่อดูรายการพนักงานทุกคนได้",
      "แก้ไข/ลบได้ทุกรายการในหน้าเดียว",
    ],
  },
  {
    version: "1.12.3",
    date: "2026-04-18",
    type: "patch",
    title: "เจ้าของร้าน (Bee) แก้ไข/ลบรายการพนักงานได้",
    changes: [
      "เพิ่มช่อง '👥 รายการของพนักงาน' แยกต่างหากในหน้าบันทึกยอดของ Bee",
      "Bee สามารถ แก้ไข และ ลบ รายการของพนักงานคนอื่นได้ (48 ชม. ล่าสุด)",
      "แสดงชื่อพนักงานเจ้าของรายการในทุก entry",
      "ช่องนี้จะเห็นเฉพาะผู้ที่ตั้งค่าเป็น 'เจ้าของร้าน' เท่านั้น",
    ],
  },
  {
    version: "1.12.2",
    date: "2026-04-17",
    type: "patch",
    title: "ลบรายการของตัวเองได้ (พนักงาน)",
    changes: [
      "พนักงานลบรายการที่ตัวเองบันทึกได้จากหน้า 'รายการที่บันทึกไว้'",
      "มีหน้ายืนยันก่อนลบเพื่อป้องกันการกดพลาด",
      "เจ้าของยังสามารถลบรายการใดก็ได้เหมือนเดิม",
    ],
  },
  {
    version: "1.12.0",
    date: "2026-04-17",
    type: "minor",
    title: "Export Excel รายงานรายวัน (เช้า/เย็น/อื่นๆ)",
    changes: [
      "Export .xlsx format ใหม่ — 1 แถว = 1 รายการ แยกตาม platform และช่วงเวลา",
      "columns: # | วันที่ | ชื่อ | Platform | เช้า(ยอด) | เย็น(ยอด) | อื่นๆ(ช่วงเวลา+ยอด) | รวม",
      "header เช้า/เย็น แสดงเวลาตามที่ระบบตั้งค่าไว้ (เช่น 09:00–16:00)",
      "อื่นๆ/กำหนดเอง ระบุช่วงเวลาจริงในเซลล์",
      "สรุปรายบุคคลและยอดรวมทั้งหมดที่ท้าย sheet",
      "preset ด่วน + date picker + preview format",
    ],
  },
  {
    version: "1.11.0",
    date: "2026-04-17",
    type: "minor",
    title: "Owner-Employee Profile & บันทึกยอดแบบ Owner",
    changes: [
      "เพิ่ม flag 'เจ้าของร้าน' ให้กับพนักงานที่เป็นเจ้าของด้วย (จัดการได้ที่หน้าพนักงาน)",
      "ชื่อพนักงานที่เป็นเจ้าของแสดง '(เจ้าของร้าน)' ในหน้า login",
      "ปุ่ม 👑 Owner บนหน้าบันทึกยอด สำหรับสลับไปโหมดเจ้าของทันที",
      "เมนู ✍️ บันทึก ฝั่ง Owner — เจ้าของบันทึกยอดให้พนักงานคนใดก็ได้",
      "ปุ่ม migration ย้ายยอดจาก Owner account → Bee (one-click, ข้อมูลไม่หาย)",
    ],
  },
  {
    version: "1.10.1",
    date: "2026-04-16",
    type: "patch",
    title: "แก้ session cookie ของ Dev mode",
    changes: [
      "แก้ปัญหา session cookie ไม่ถูก set ก่อน redirect ใน Vercel",
      "เปลี่ยนให้ server action return { success } แล้วให้ client navigate แทน",
      "เพิ่มลิงก์ ⚡ Dev ที่หน้า staff login",
    ],
  },
  {
    version: "1.10.0",
    date: "2026-04-16",
    type: "minor",
    title: "Developer Mode",
    changes: [
      "หน้า /dev สำหรับ developer login ด้วย PIN (dark theme)",
      "Dev Banner แสดงทุกหน้าเมื่ออยู่ใน dev mode",
      "Dev สามารถ impersonate พนักงานคนใดก็ได้จากหน้า Dev Home",
      "Dev Home แสดง stats เดือนนี้, activity log ล่าสุด",
    ],
  },
  {
    version: "1.9.0",
    date: "2026-04-16",
    type: "minor",
    title: "Feature Batch — Dashboard, Targets, Log PIN, Export",
    changes: [
      "Dashboard: กรองตามปี และกำหนดช่วงวันเองได้",
      "Targets: เพิ่ม YEARLY และระบบ Campaign Target",
      "Insights: ปรับ time slot analysis ให้เข้าใจง่าย (ranked cards + ฿/ชั่วโมง)",
      "Log: เพิ่ม PIN Gate กั้นก่อนเข้าดู activity log",
      "Insights: ปุ่ม Export CSV และ Print",
      "Log เพิ่มเป็นเมนูในแถบนำทาง",
    ],
  },
  {
    version: "1.8.0",
    date: "2026-04-16",
    type: "minor",
    title: "Insights วิเคราะห์ยอดขาย",
    changes: [
      "หน้า 🔍 วิเคราะห์ ใหม่ในแถบนำทาง Owner",
      "วิเคราะห์ช่วงเวลาที่ขายดีที่สุด (เช้า/เย็น/กำหนดเอง) พร้อม CSS timeline",
      "วิเคราะห์ยอดขายแยก Platform และ Brand",
      "วิเคราะห์ผลงานพนักงานแต่ละคน",
      "รองรับช่วงเวลาที่คาบเกี่ยว (overlap detection)",
    ],
  },
  {
    version: "1.7.0",
    date: "2026-04-16",
    type: "minor",
    title: "Session Migration & Time Labels",
    changes: [
      "ปุ่ม migration ใน Sessions — ย้าย entry เก่าที่ไม่มี session มาผูกได้",
      "แสดงชื่อช่วงเวลาแบบ friendly (เช้า/เย็น/กำหนดเอง)",
      "แก้ข้อความ 'บันทึกแทน' → 'ไลฟ์แทน'",
    ],
  },
  {
    version: "1.6.0",
    date: "2026-04-16",
    type: "minor",
    title: "Schedule Mismatch Detection",
    changes: [
      "ตารางงานตรวจจับความไม่ตรงกันระหว่างแผนกับยอดจริง",
      "แจ้งเตือนเมื่อพนักงานที่กำหนดไว้ ≠ คนที่บันทึกยอดจริง",
      "แจ้งเตือนช่วงเวลาที่ต่างจากตาราง",
      "แสดง entry จริงในตารางงาน แม้ไม่มีแผน",
    ],
  },
  {
    version: "1.5.0",
    date: "2026-04-16",
    type: "minor",
    title: "Leave & Payroll Improvements",
    changes: [
      "หน้า Payroll ใหม่ — สรุปเงินเดือนรายเดือน, export CSV, print/PDF",
      "Leave auto carry-forward ทุกปีใหม่",
      "Navigation เดือน Payroll ด้วยปุ่ม ‹ ›",
      "Dropdown เลือกเดือนโดยตรง",
    ],
  },
  {
    version: "1.4.0",
    date: "2026-04-16",
    type: "minor",
    title: "Live Schedule & Dashboard Comparison",
    changes: [
      "ตารางงาน: เลือก Platform และ Brand ให้แต่ละ slot ได้",
      "Dashboard: เปรียบเทียบยอดกับช่วงก่อนหน้า",
      "Time Presets (เช้า/เย็น/กำหนดเอง) ในหน้าบันทึกยอด",
      "ซ่อน ranking พนักงานได้",
      "ยกเลิกจำกัด 24 ชั่วโมง, ปรับขนาด header/nav",
    ],
  },
  {
    version: "1.3.0",
    date: "2026-04-15",
    type: "minor",
    title: "Stats, Export & Finance",
    changes: [
      "Stats card บนหน้าบันทึกยอด — ยอดวันนี้และรายสัปดาห์",
      "Export CSV สำหรับรายงานยอดขาย",
      "Date range filter ในหน้า Entries",
      "Badge จำนวน entry วันนี้บนไอคอน Dashboard",
      "แก้หน้าการเงิน (Finance)",
    ],
  },
  {
    version: "1.2.0",
    date: "2026-04-15",
    type: "minor",
    title: "Employee Management, Schedule, Leave & Targets",
    changes: [
      "จัดการพนักงาน: เพิ่ม/แก้ไข/ลบ, อัปโหลดรูปโปรไฟล์",
      "ตารางงาน (Schedule) รายสัปดาห์",
      "ระบบวันลา (Leave) พร้อมสิทธิ์แต่ละประเภท",
      "เป้ายอดขาย (Targets) รายวัน/สัปดาห์/เดือน",
      "แก้ไข entry ย้อนหลังได้",
    ],
  },
  {
    version: "1.0.0",
    date: "2026-04-15",
    type: "major",
    title: "เปิดตัว Beeative LiveBoard 🐝",
    changes: [
      "บันทึกยอดขายรายวัน แยก Platform (TikTok/Shopee/Facebook/อื่นๆ)",
      "Login พนักงานด้วย PIN 4 หลัก",
      "หน้า Dashboard สำหรับเจ้าของ",
      "ระบบ Brand และ Commission Rate",
      "Activity Log บันทึกทุก action",
    ],
  },
];
