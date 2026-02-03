# Deploy ขึ้น Render

## รันแยก Frontend / Backend (พัฒนา)

- **Backend:** `pnpm dev` (port 3000)
- **Frontend:** `pnpm dev:client` (Vite ที่ port 5173)

ดูรายละเอียดใน README.md

---

## สถานะ: **พร้อมขึ้น Render**

โปรเจกต์ตั้งค่า build/start และใช้ `PORT` จาก environment ได้แล้ว เหมาะกับ Render Web Service (Node).

---

## ขั้นตอนบน Render

### 1. สร้าง Web Service

- Repo: เชื่อม GitHub/GitLab ของโปรเจกต์นี้
- **Runtime**: Node
- **Build Command**: `pnpm install && pnpm run build`
- **Start Command**: `pnpm start` (หรือ `node dist/index.js`)

### 2. Environment Variables (ตั้งใน Dashboard)

| Variable | จำเป็น | หมายเหตุ |
|----------|--------|----------|
| `NODE_ENV` | ไม่ (Render ตั้งให้ได้) | ใช้ `production` ตอนรัน |
| `PORT` | ไม่ | Render ส่งให้อัตโนมัติ |
| `MONGODB_URI` | **ใช่** | Connection string MongoDB (users, projects, usageLogs) |
| `OAUTH_SERVER_URL` | ถ้าใช้ Login | URL OAuth server |
| `JWT_SECRET` | ถ้าใช้ Login | Secret สำหรับ session |
| `VITE_APP_ID` | ถ้าใช้ Login | App ID ฝั่ง OAuth |
| `VITE_API_BASE_URL` | ไม่ | ใช้เมื่อแยก front/back; ถ้าโฮสต์เดียวกันไม่ต้องตั้ง |

### 3. สิ่งที่โปรเจกต์ทำอยู่แล้ว

- อ่าน **PORT** จาก `process.env.PORT` (ค่าเริ่มต้น 3000)
- Build แล้วมี `dist/index.js` (server) และ `dist/public/` (frontend)
- Production ใช้ static จาก `dist/public` (ไม่ใช้ Vite dev server)
- ไม่ block ตาม quota (soft limit)

### 4. (ถ้าใช้) Render Blueprint

มีไฟล์ `render.yaml` ไว้เป็นตัวอย่าง กำหนด Build/Start command และ env ได้จาก Dashboard แทนก็ได้

---

## ตรวจหลัง Deploy

- เปิด URL ที่ Render ให้ (เช่น `https://alexza-systems.onrender.com`)
- ควรเห็นหน้า Dashboard / Project Selector
- ถ้าไม่มี OAuth: ใช้ mock mode ได้ (ถ้ามีในโค้ด)
- ตรวจ MongoDB ว่าเชื่อมได้ (ดู log ไม่มี error เรื่อง connection)
