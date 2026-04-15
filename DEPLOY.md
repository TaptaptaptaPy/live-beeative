# คู่มือ Deploy บน Vercel

Vercel เป็น platform ที่ทำงานกับ Next.js ได้ดีที่สุด (บริษัทเดียวกัน) เข้าใช้งานผ่าน URL บนมือถือหรือคอมได้เลย ไม่ต้องลง App

---

## ขั้นตอนที่ 1 — Push โค้ดขึ้น GitHub

เปิด Terminal แล้วพิมพ์:

```bash
cd "/Users/toptap/My Project/live-manager"
git add .
git commit -m "update"
git push origin main
```

---

## ขั้นตอนที่ 2 — เชื่อม GitHub กับ Vercel

1. ไปที่ [vercel.com](https://vercel.com) → Login ด้วย GitHub
2. คลิก **Add New → Project**
3. เลือก repo **live-beeative**
4. Framework ตรวจจับ **Next.js** อัตโนมัติ — ไม่ต้องแก้อะไร
5. **อย่ากด Deploy ยัง** — ไปทำขั้นตอน 3 ก่อน

---

## ขั้นตอนที่ 3 — ตั้งค่า Environment Variables

ใน Vercel → หน้า Configure Project → แท็บ **Environment Variables**

เพิ่มตัวแปรต่อไปนี้ทีละอัน:

| Variable | ค่า |
|---|---|
| `DATABASE_URL` | (คัดลอกจาก Neon dashboard — เป็น URL ที่ขึ้นต้นด้วย `postgresql://`) |
| `SESSION_SECRET` | `ZQOzB8tCqgYU4RYYgxTy9cpoZvORc1YzZ6cntejaS7A=` |
| `OWNER_EMAIL` | `wannabeeinspired@gmail.com` |
| `OWNER_PASSWORD` | รหัสผ่านของเจ้าของ |

> **หา DATABASE_URL จาก Neon ได้ที่:**  
> [console.neon.tech](https://console.neon.tech) → เลือก Project → แท็บ **Connection Details** → คัดลอก Connection string

---

## ขั้นตอนที่ 4 — Deploy

คลิกปุ่ม **Deploy** ใน Vercel รอประมาณ **2–3 นาที**

Vercel จะรัน `prisma generate && next build` ให้อัตโนมัติ

---

## ขั้นตอนที่ 5 — Seed ข้อมูลครั้งแรก (ทำครั้งเดียว)

หลัง deploy เสร็จ เปิด URL ที่ Vercel ให้ แล้วไปที่:

```
https://YOUR-APP.vercel.app/api/seed
```

เปิดใน browser ได้เลย (GET request) ระบบจะสร้าง:
- บัญชีเจ้าของ (ใช้ OWNER_EMAIL / OWNER_PASSWORD ที่ตั้งไว้)
- ช่วงเวลาไลฟ์เริ่มต้น (เช้า / กลางวัน / เย็น / ดึก)
- กฎ Incentive เริ่มต้น 1%

> ถ้าเคย Seed ไปแล้ว ข้ามขั้นตอนนี้

---

## ขั้นตอนที่ 6 — ใช้งาน!

Vercel จะให้ URL เช่น `https://live-beeative.vercel.app`

| ผู้ใช้ | URL |
|---|---|
| พนักงาน | `https://YOUR-APP.vercel.app` |
| เจ้าของ | `https://YOUR-APP.vercel.app/owner/login` |

> **แนะนำ:** Add URL ไปที่ Home Screen มือถือ (iOS: Share → Add to Home Screen / Android: เมนู 3 จุด → Add to Home Screen) เปิดได้เหมือน App เลย

---

## การ Deploy ครั้งต่อไป (Auto)

เมื่อ push โค้ดขึ้น GitHub → Vercel deploy ให้อัตโนมัติทุกครั้ง

```bash
git add .
git commit -m "อธิบายการเปลี่ยนแปลง"
git push origin main
```

รอ 2–3 นาที → ใช้งานได้เลย

---

## ใช้งานครั้งแรก

1. เจ้าของ Login ที่ `/owner/login`
2. ไปที่ **พนักงาน** → เพิ่มชื่อพนักงาน (ไม่ต้องตั้ง PIN — พนักงานตั้งเองในครั้งแรกที่ Login)
3. ไปที่ **ตาราง** → ลงตารางไลฟ์ให้พนักงาน
4. บอก URL ให้พนักงาน → เลือกชื่อ → ตั้ง PIN → กรอกยอดได้เลย

---

## ค่าใช้จ่าย Vercel

| Plan | ราคา | เหมาะกับ |
|---|---|---|
| Hobby (ฟรี) | $0 | ทดสอบ / ใช้งานเบาๆ |
| Pro | $20/เดือน | Production จริง ทีม < 50 คน |

สำหรับทีมเล็ก (< 10 คน) **Hobby plan ฟรีใช้ได้เลย**

> **Neon DB ฟรี tier:** รองรับ 0.5 GB storage, 190 compute hours/เดือน — เพียงพอสำหรับทีมเล็ก
