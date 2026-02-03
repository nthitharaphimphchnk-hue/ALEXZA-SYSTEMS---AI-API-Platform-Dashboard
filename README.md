# ALEXZA-SYSTEMS---AI-API-Platform-Dashboard

Developer Portal for ALEXZA SYSTEMS AI APIs. Provides authentication, project management, API keys, playground, usage logs, and billing-ready architecture for AI services such as Thai Typography Intelligence (TTI).

## รันแยก Frontend / Backend

- **Backend (Express + tRPC):**  
  `pnpm dev`  
  รันที่ port 3000 (หรือค่า `PORT` ใน env)

- **Frontend (Vite):**  
  `pnpm dev:client`  
  รันที่ port **5173** (ค่า default ของ Vite)

รันทั้งสองคำสั่งในเทอร์มินัลคนละอัน ถ้าจะรันรวม (backend เสิร์ฟ frontend ผ่าน Vite middleware) ใช้ `pnpm dev` อย่างเดียวแล้วเปิดตาม URL ที่ backend แจ้ง (มักเป็น port 3000).
