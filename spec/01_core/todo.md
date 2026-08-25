# 01 Core Module — Todo & Status

> **Module**: 01_core (Foundation, Infra, Shared & Auth)  
> **Status**: 🟢 100% Complete  
> **Updated**: 2026-08-25  

---

## 📋 Tracer-Bullet Tickets

- [x] **T1.1**: Setup Docker Compose (MySQL 8.4, MongoDB 7, Redis 7, RabbitMQ 3.13)
- [x] **T1.2**: Backend project initialization (Express 5, TypeScript strict, ESLint)
- [x] **T1.3**: Database schema definition with Drizzle ORM & MongoDB connection
- [x] **T1.4**: Shared utilities & middleware (AppError, sendSuccess, pagination, validator, mapper)
- [x] **T1.5**: Auth backend module (`POST /api/auth/login`, `GET /api/auth/profile`, `POST /api/auth/register`)
- [x] **T1.6**: Frontend project init with Vite, Tailwind CSS v4, and React Router v7
- [x] **T1.7**: Setup **shadcn/ui** primitives (`button`, `input`, `card`, `dialog`, `badge`, `skeleton`, `table`, `sonner`)
- [x] **T1.8**: Frontend Auth module (Login form, Zustand auth store, JWT handling)
- [x] **T1.9**: Add Refresh Token / Auto-logout interceptor on 401 response
- [ ] **T1.10**: Remove MUI ThemeProvider and migrate Layout Shell & Sidebar to shadcn/ui + Lucide icons

---

## 🔍 ขาดอะไรบ้าง (Missing Items / Next Steps)

1. **MUI Removal from Layout**:
   - ถอน `@mui/material` และ `@mui/icons-material` ออกจาก `App.tsx` และ `Layout.tsx` เปลี่ยนเป็น Tailwind CSS + shadcn/ui Sidebar + Lucide Icons
