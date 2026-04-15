# คู่มือ Deploy Live Manager

## วิธี Deploy ง่ายๆ บน Railway (แนะนำ)

Railway เป็น platform ที่รวม App + Database ในที่เดียว ค่าบริการเริ่มต้นประมาณ $5/เดือน เข้าใช้งานผ่าน URL บนมือถือหรือคอมได้เลย ไม่ต้องลง App

---

### ขั้นตอนที่ 1: สร้าง GitHub Repository

1. ไปที่ https://github.com และสมัครบัญชีฟรี (ถ้ายังไม่มี)
2. สร้าง Repository ใหม่ ชื่อ `live-manager` (Private)
3. เปิด Terminal (หรือ Command Prompt) แล้วพิมพ์:

```bash
cd "/Users/toptap/My Project/live-manager"
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/live-manager.git
git push -u origin main
```

---

### ขั้นตอนที่ 2: สร้าง Railway Project

1. ไปที่ https://railway.app และ Login ด้วย GitHub
2. คลิก **New Project**
3. เลือก **Deploy from GitHub repo**
4. เลือก repo `live-manager` ที่สร้างไว้
5. Railway จะเริ่ม deploy อัตโนมัติ

---

### ขั้นตอนที่ 3: เพิ่ม PostgreSQL Database

1. ใน Railway project ของคุณ คลิก **+ New**
2. เลือก **Database** → **PostgreSQL**
3. Railway จะสร้าง database และให้ `DATABASE_URL` อัตโนมัติ

---

### ขั้นตอนที่ 4: ตั้งค่า Environment Variables

ใน Railway → ไปที่ service `live-manager` → แท็บ **Variables** → เพิ่มตัวแปรต่อไปนี้:

| Variable | ค่า |
|---|---|
| `DATABASE_URL` | คัดลอกจาก PostgreSQL service (Railway จะ link ให้อัตโนมัติ) |
| `SESSION_SECRET` | `ZQOzB8tCqgYU4RYYgxTy9cpoZvORc1YzZ6cntejaS7A=` |
| `OWNER_EMAIL` | อีเมลเจ้าของร้าน เช่น `boss@myshop.com` |
| `OWNER_PASSWORD` | รหัสผ่านเจ้าของ เช่น `MyShop2024!` |

> **หมายเหตุ:** เปลี่ยน SESSION_SECRET ด้วยการรัน `openssl rand -base64 32` ใน terminal

---

### ขั้นตอนที่ 5: Run Database Migration

ใน Railway → service `live-manager` → แท็บ **Shell** → พิมพ์:

```bash
npx prisma migrate deploy
```

---

### ขั้นตอนที่ 6: Seed ข้อมูลเริ่มต้น

หลัง deploy เสร็จ เปิด URL ของ app แล้วไปที่:
```
https://YOUR-APP.railway.app/api/seed
```
ด้วย method POST (ใช้ curl หรือ Postman):
```bash
curl -X POST https://YOUR-APP.railway.app/api/seed
```
**หรือ** เพิ่ม seed button ผ่าน browser extension

ระบบจะสร้าง:
- บัญชีเจ้าของ (ใช้ email/password ที่ตั้งไว้)
- ช่วงเวลาไลฟ์เริ่มต้น (เช้า/เย็น/ดึก)
- กฎ Incentive เริ่มต้น 1%

---

### ขั้นตอนที่ 7: ใช้งาน!

Railway จะให้ URL เช่น `https://live-manager-production.up.railway.app`

- **พนักงาน**: เปิด URL นี้ → เลือกชื่อ → ใส่ PIN → กรอกยอดขาย
- **เจ้าของ**: ไปที่ `URL/owner/login` → ใส่ email/password

> **แนะนำ**: Add URL ไปที่ Home Screen มือถือ (iOS/Android) เพื่อเปิดได้เหมือน App

---

## การใช้งานครั้งแรก

1. เจ้าของ Login ที่ `/owner/login`
2. ไปที่ **พนักงาน** → เพิ่มชื่อพนักงานและตั้ง PIN
3. ไปที่ **ช่วงเวลา** → ปรับเวลาไลฟ์ตามต้องการ
4. บอก URL ให้พนักงาน → พนักงานเลือกชื่อ ใส่ PIN → กรอกยอดได้เลย

---

## การตั้ง PIN เพิ่มเติม

PIN ของพนักงานตั้งได้ตอนเพิ่มพนักงาน (4 ตัวเลข) เช่น 1234, 5678
ถ้าต้องการเปลี่ยน PIN ต้องเพิ่มฟีเจอร์ Edit Employee (roadmap)

---

## ค่าใช้จ่าย Railway

- **Starter Plan**: ฟรี (มี limit)  
- **Pro Plan**: $5/เดือน (แนะนำสำหรับ production)

สำหรับ startup ขนาดเล็ก (< 10 พนักงาน) Starter Plan น่าจะเพียงพอ

---

## โปรแกรมเสริม (แนะนำ อนาคต)

- **LINE Notify**: แจ้งเจ้าของเมื่อพนักงานกรอกยอด (เพิ่มใน `/app/actions/entries.ts`)
- **Export Excel**: ส่งออก Incentive เป็น Excel รายเดือน
- **PWA Icon**: เพิ่ม icon ให้ add to home screen สวยขึ้น
