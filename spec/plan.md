# Versus Thailand ERP System — Master Plan

> **Business**: ติดตั้งแก๊สรถยนต์ (CNG/LPG Vehicle Gas Installation)
> **Purpose**: โปรเจกต์ศึกษาก่อนเข้าทำงานจริง (Study/Learning Project) — ไม่มี Deploy จริง
> **Type**: Internal ERP พร้อม AI Chatbot
> **Stack**: React 19 (MVC) + React Router + MUI + Tailwind / Node.js + Express 5 — ALL TypeScript
> **Infra**: Docker Compose — MySQL, MongoDB, Redis, RabbitMQ

---

## 1. Project Overview

โปรเจกต์นี้สร้างขึ้นเพื่อ **ศึกษาและเรียนรู้** การสร้างระบบ ERP สำหรับ Versus Thailand ก่อนเริ่มงานจริง โดยมีหัวใจหลักคือ **AI Chatbot** ที่สามารถตอบคำถามเกี่ยวกับข้อมูลธุรกิจผ่านแชท เช่น "วันนี้ยอดขายเท่าไหร่" "รถที่เข้าคิววันนี้มีกี่คัน" "สต็อกถังแก๊สเหลือเท่าไหร่" และสามารถ Export ข้อมูลเป็น CSV, HTML, JSON ได้ตามต้องการ

จุดประสงค์หลักของโปรเจกต์:
- เรียนรู้การออกแบบและสร้าง ERP ตั้งแต่ศูนย์
- ศึกษา SQL + NoSQL ใช้ร่วมกันในระบบจริง
- ศึกษา Message Queue (RabbitMQ) และ Cache (Redis)
- ทดลอง AI/LLM Integration กับระบบ ERP
- สร้างพอร์ตสำหรับใช้ตอนสัมภาษณ์ / onboarding

**ไม่มีการ Deploy ขึ้น Production** — ใช้ Docker Compose รันบน Localhost เท่านั้น

แบ่งการพัฒนาเป็น **3 Phase**:
- **Phase 1 (MVP)**: Core business modules + AI Chat พื้นฐาน + Testing
- **Phase 2**: ฟีเจอร์ขั้นสูง + Report + Export
- **Phase 3**: Optimization, Advanced Features

---

## 2. ERP Modules

### 2.1 Core Modules (Phase 1 — MVP)

| # | Module | รายละเอียด | Priority |
|---|--------|-----------|----------|
| 1 | **Inventory (คลังสินค้า)** | จัดการสต็อกอุปกรณ์ติดตั้งแก๊ส: ถังแก๊ส, หัวฉีด, ECU, สายท่อ, ขายึด ฯลฯ | 🔴 High |
| 2 | **Customer Management (CRM)** | ข้อมูลลูกค้า + ข้อมูลรถ (ทะเบียน, ยี่ห้อ, รุ่น, ประเภทเครื่องยนต์) | 🔴 High |
| 3 | **Sales & Invoicing (ขาย/ใบแจ้งหนี้)** | เปิดบิล, ใบเสนอราคา, ใบกำกับภาษี (เต็มรูป/อย่างย่อ), รับชำระเงิน | 🔴 High |
| 4 | **Job/Installation Management (งานติดตั้ง)** | รับรถเข้า-ออก, ตารางคิว, มอบหมายช่าง, ติดตามสถานะงาน | 🔴 High |
| 5 | **AI Chatbot** | ถาม-ตอบข้อมูลธุรกิจด้วยภาษาธรรมชาติ (Thai/English) | 🔴 High |
| 6 | **Authentication & Roles** | Login, Roles (Admin, Manager, Staff, Technician) | 🔴 High |

### 2.2 Extended Modules (Phase 2)

| # | Module | รายละเอียด | Priority |
|---|--------|-----------|----------|
| 7 | **Supplier & Procurement (จัดซื้อ)** | จัดการซัพพลายเออร์, ใบสั่งซื้อ, รับของเข้า | 🟡 Medium |
| 8 | **Accounting & Finance (บัญชี)** | รายรับ-รายจ่าย, กำไรขั้นต้น, ต้นทุนต่อคัน, Dashboard การเงิน | 🟡 Medium |
| 9 | **Employee Management (พนักงาน)** | ข้อมูลพนักงาน, เวลาเข้างาน, Commission ช่าง | 🟡 Medium |
| 10 | **Reports & Analytics** | ยอดขายรายวัน/เดือน/ปี, สรุปงานติดตั้ง, สต็อกคงเหลือ, Export CSV/PDF/HTML | 🟡 Medium |
| 11 | **Warranty Management (ประกัน)** | ติดตามประกันงานติดตั้ง, รับเคลม | 🟢 Low |

### 2.3 Future Modules (Phase 3)

| # | Module | รายละเอียด | Priority |
|---|--------|-----------|----------|
| 12 | **Mobile App / PWA** | สำหรับช่างหน้างาน + ผู้จัดการดูยอดบนมือถือ | 🟢 Low |
| 13 | **Notifications** | Line Notify / Email แจ้งเตือนสถานะงาน, สต็อกใกล้หมด | 🟢 Low |
| 14 | **Advanced AI** | พยากรณ์ยอดขาย, แนะนำสต็อกที่ควรสั่ง, วิเคราะห์แนวโน้ม | 🟢 Low |

---

## 3. AI Chatbot Design

### 3.1 แนวคิด

AI Chatbot ทำหน้าที่เป็น "ผู้ช่วย" ที่เข้าใจภาษาธรรมชาติ (ไทย/อังกฤษ) และแปลงเป็น Query เพื่อดึงข้อมูลจาก Database โดย:

```
User Input (Natural Language)
    → Intent Detection + Entity Extraction (LLM)
    → SQL/Query Generation
    → Execute Query against DB
    → Format Response
    → Return to User (Text, Table, CSV, HTML, JSON)
```

### 3.2 ตัวอย่างการใช้งาน

| User Ask | Intent | Response |
|-----------|--------|----------|
| "วันนี้ยอดขายเท่าไหร่" | `sales_summary_today` | "วันนี้มียอดขาย 85,000 บาท จาก 6 คัน" |
| "วันนี้มีรถเข้าคิวกี่คัน" | `job_queue_today` | "วันนี้มีรถเข้าคิวทั้งหมด 8 คัน ติดตั้งเสร็จแล้ว 3 คัน" |
| "สต็อกถังแก๊ส 58L เหลือเท่าไหร่" | `inventory_check` | "ถังแก๊ส 58L คงเหลือ 12 ใบ / ขั้นต่ำที่ต้องมี 5 ใบ" |
| "export ยอดเดือนนี้เป็น csv" | `export_csv` | (ส่งไฟล์ CSV) |
| "ช่างสมชายทำยอดเดือนนี้เท่าไหร่" | `technician_sales` | "ช่างสมชาย ติดตั้งไป 15 คัน ยอดรวม 195,000 บาท" |

### 3.3 LLM Model Recommendation

> **หมายเหตุ**: คำว่า "opencode" เป็น AI Coding Assistant ไม่ใช่ LLM API สำหรับการใช้งานในแอปพลิเคชัน
>
> ตัวเลือกที่แนะนำสำหรับ AI Chatbot:
> 1. **OpenAI API (GPT-4o / GPT-4o-mini)** — รองรับภาษาไทยดีที่สุด ต้นทุน ~$3-5/1M tokens
> 2. **Anthropic Claude API** — รองรับไทยดีปานกลาง มี function calling
> 3. **Google Gemini** — ราคาถูก มี free tier รองรับไทยดี
> 4. **Open-source (Llama 3, Qwen 2.5)** — รันเองบนเซิร์ฟเวอร์ (แนะนำ Qwen 2.5 — รองรับไทยดี)
>
> **แนะนำ**: เริ่มที่ **Gemini Flash** (ถูก/ฟรี) หรือ **GPT-4o-mini** (คุณภาพดี ราคาเบา) → Scale up ถ้าต้องการ accuracy สูง

### 3.4 Chatbot Architecture (Full Stack)

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                       │
│  ┌───────────────────────────────────────────────────┐  │
│  │           Chat Panel (MUI + Tailwind)               │  │
│  │  - Text Input (Thai/English)                        │  │
│  │  - Message History                                  │  │
│  │  - Format Selector (CSV/HTML/JSON/Table)            │  │
│  │  - Loading / Streaming Indicator                    │  │
│  │  - Polling for async results                        │  │
│  └───────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP / SSE (Streaming)
┌──────────────────────▼──────────────────────────────────┐
│                Backend (Express)                          │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │             Chat Controller                         │  │
│  │  1. Check Redis Cache: ai:cache:{md5(question)}    │  │
│  │  2. Build context (schema, business rules)         │  │
│  │  3. Call LLM API with system prompt + tools        │  │
│  │  4. Parse LLM response → SQL Query                 │  │
│  │  5. SQL Sanitizer (read-only guard)                │  │
│  │  6. Queue to RabbitMQ if heavy → return jobId      │  │
│  │  7. Execute SQL on MySQL (light queries)            │  │
│  │  8. Cache result in Redis (10min TTL)              │  │
│  │  9. Log to RabbitMQ → audit_log MongoDB            │  │
│  │ 10. Format & Return response                       │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │             AI Worker (RabbitMQ Consumer)           │  │
│  │  - Receives heavy queries from erp.ai.expensive    │  │
  │  │  - Executes on MySQL with timeout                   │  │
│  │  - Stores result in Redis (key: job:{jobId})       │  │
│  │  - Publishes to erp.notifications when done        │  │
│  └───────────────────────────────────────────────────┘  │
└──────┬──────────────┬──────────────┬────────────────────┘
       │              │              │
┌──────▼──────┐ ┌─────▼──────┐ ┌───▼──────────────┐
│   MySQL     │ │   Redis    │ │   RabbitMQ       │
│   (SQL)     │ │  (Cache)   │ │ (Message Queue)  │
│             │ │            │ │                  │
│ Business    │ │ Dashboard  │ │ reports.gen      │
│ Data,       │ │ Cache,     │ │ notifications    │
│ Invoices,   │ │ Sessions,  │ │ ai.expensive     │
│ Jobs,       │ │ Rate Limit │ │ stock.alerts     │
│ Inventory   │ │ AI Cache   │ │ audit.log        │
└─────────────┘ └────────────┘ └──────┬───────────┘
                                      │
                            ┌─────────▼──────────┐
                            │     MongoDB         │
                            │    (NoSQL)          │
                            │                    │
                            │ Chat History,      │
                            │ Activity Logs,     │
                            │ Audit Trail        │
                            └────────────────────┘
```

---

## 4. Database Schema (Core Tables)

```sql
-- ===== AUTH =====
users (id, username, password_hash, display_name, role, created_at)
roles (id, name, permissions)

-- ===== CUSTOMERS =====
customers (id, first_name, last_name, phone, email, address, created_at)
vehicles (id, customer_id, license_plate, brand, model, year, engine_type, fuel_type)

-- ===== INVENTORY =====
categories (id, name, description)
products (id, category_id, sku, name, description, unit, cost_price, sell_price, min_stock, current_stock, created_at)
stock_movements (id, product_id, type [IN/OUT/ADJUST], quantity, reference_type, reference_id, created_by, note, created_at)

-- ===== SALES =====
quotations (id, customer_id, vehicle_id, total_amount, discount, status, created_by, created_at)
quotation_items (id, quotation_id, product_id, quantity, unit_price, total)
invoices (id, customer_id, vehicle_id, quotation_id, invoice_number, total_amount, discount, tax, grand_total, payment_status, payment_method, created_by, created_at)
invoice_items (id, invoice_id, product_id, quantity, unit_price, total)

-- ===== JOBS (Installation) =====
jobs (id, customer_id, vehicle_id, invoice_id, job_type [INSTALL/REPAIR/INSPECT], status [QUEUED/IN_PROGRESS/COMPLETED/CANCELLED], scheduled_date, start_time, end_time, technician_id, notes, created_at)
job_items (id, job_id, product_id, quantity)
job_status_logs (id, job_id, from_status, to_status, changed_by, note, created_at)

-- ===== SUPPLIERS =====
suppliers (id, name, contact_name, phone, email, address, created_at)
purchase_orders (id, supplier_id, status, total_amount, ordered_by, created_at)
purchase_order_items (id, po_id, product_id, quantity, unit_price, total)

-- ===== AI AUDIT =====
ai_query_logs (id, user_id, question, generated_sql, result_count, execution_time_ms, created_at)

```

### 4.1 SQL vs NoSQL — ทำไมต้องใช้ทั้งคู่

ERP แบบดั้งเดิมใช้ SQL (Relational) 100% แต่ระบบสมัยใหม่ใช้ **Polyglot Persistence** — เลือก DB ให้เหมาะกับลักษณะข้อมูล

| ลักษณะข้อมูล | ใช้ DB อะไร | เหตุผล |
|--------------|-------------|--------|
| **ข้อมูลธุรกิจหลัก** (Customers, Products, Invoices, Jobs) | **MySQL (SQL)** | — ข้อมูลมีโครงสร้างตายตัว (Schema)<br>— ต้องการ ACID Transactions (เช่น ตัดสต็อก + สร้างบิล ต้องเกิดพร้อมกัน)<br>— ความสัมพันธ์ซับซ้อน (JOIN หลายตาราง)<br>— รายงานที่ต้องการ Aggregate/Group By |
| **Chat History / AI Query Logs** | **MongoDB (NoSQL)** | — ข้อมูลกึ่งโครงสร้าง (message มี metadata ไม่เท่ากัน)<br>— ปริมาณมาก + Write-heavy (log ทุกครั้งที่คุย AI)<br>— ไม่ต้อง JOIN กับตารางอื่น<br>— Schema ยืดหยุ่น — ถ้าเปลี่ยน format ข้อความ ไม่ต้อง migrate |
| **Audit Logs / Activity Logs** | **MongoDB (NoSQL)** | — Append-only, high-write volume<br>— แต่ละ event มี payload ต่างกัน (login, create invoice, change status)<br>— เก็บแยกจาก DB หลัก ถ้า audit log โตมาก จะไม่กระทบ MySQL |
| **Product Specifications** | **MySQL JSON column** | — รายละเอียดสินค้าแต่ละประเภทไม่เหมือนกัน (ถังแก๊สมี capacity, ECU มี firmware version)<br>— ใช้ JSON column ใน MySQL แทนการสร้างอีก collection<br>— ข้อดี: ใช้ร่วมกับ SQL query ได้ |

**สรุปการแบ่งหน้าที่**:
```
MySQL       → "Source of Truth" — ข้อมูลธุรกิจที่ต้องการความถูกต้อง 100%
MongoDB    → "Log & History"  — ข้อมูลที่ append อย่างเดียว, volume สูง
Redis      → "Cache & Real-time" — ข้อมูลที่อ่านบ่อย, ต้องการความเร็ว
RabbitMQ   → "Async Worker"   — งานที่ไม่อยากให้ block request
```

### 4.2 MongoDB Collections (NoSQL)

```js
// Chat History
chat_messages {
  _id: ObjectId,
  userId: ObjectId,
  sessionId: "uuid",
  question: "วันนี้ยอดขายเท่าไหร่",
  answer: "วันนี้ยอดขาย 85,000 บาท จาก 6 คัน",
  generatedSql: "SELECT SUM(grand_total) FROM invoices WHERE ...",
  format: "text",  // text | csv | html | json
  resultRowCount: 6,
  executionTimeMs: 230,
  createdAt: ISODate("2026-07-18T10:30:00+07:00")
}

// Activity / Audit Logs
activity_logs {
  _id: ObjectId,
  userId: ObjectId,
  action: "invoice.create" | "job.status_change" | "product.stock_adjust",
  entityType: "invoice" | "job" | "product",
  entityId: "uuid",
  changes: { from: {...}, to: {...} },
  ipAddress: "127.0.0.1",
  createdAt: ISODate(...)
}
```

### 4.3 Redis Usage (Cache + Session)

| Use Case | Key Pattern | TTL | คำอธิบาย |
|----------|------------|-----|-----------|
| **Today Sales Summary** | `dashboard:sales:today:{userId}` | 5 min | ยอดขายสด ไม่ต้อง query ซ้ำทุกครั้งที่เปิด Dashboard |
| **Low Stock Alert** | `inventory:low_stock:list` | 10 min | รายการสินค้าที่ต่ำกว่าจุดสั่ง — cache ไว้ให้แชท AI อ่านเร็ว |
| **Rate Limiter** | `ratelimit:{userId}:{endpoint}` | 1 min | กัน abuse โดยเฉพาะ API Chat |
| **User Session** | `session:{sessionId}` | 24 hr | JWT ไม่พอ — เก็บ server-side session สำหรับ revoke ได้ทันที |
| **Job Queue Today** | `jobs:today:queue` | 1 min | คิวงานวันนี้ — cache ไว้ให้ Dashboard |
| **AI Query Cache** | `ai:cache:{md5(question)}` | 10 min | ถ้ามีคนถามคำถามเดิมซ้ำ (เช่น "วันนี้ยอดเท่าไหร่") → ตอบจาก cache ไม่ต้องเรียก LLM + DB |

### 4.4 RabbitMQ Usage (Message Queue)

RabbitMQ ใช้สำหรับงานที่ **ไม่จำเป็นต้องตอบทันที** (Async/Background Jobs):

| Queue Name | Producer | Consumer | คำอธิบาย |
|------------|----------|----------|-----------|
| `erp.reports.generate` | API (เมื่อ user ขอ export) | Report Worker | สร้างไฟล์ report ใหญ่ๆ (CSV, PDF) — ใช้เวลานาน, ตอบกลับผ่าน notification |
| `erp.notifications.send` | ทุก module (event-driven) | Notification Worker | ส่งแจ้งเตือน (Line Notify, Email) เช่น "สต็อกถัง 58L เหลือ 3 ใบ" "รถคิวที่ 5 เสร็จแล้ว" |
| `erp.ai.expensive_query` | Chat Controller | AI Worker | AI query ที่ใช้เวลานาน → offload ไป worker, user รอ polling |
| `erp.stock.alerts` | Inventory Service | Alert Worker | เมื่อ stock เปลี่ยนแปลง → check ว่าต่ำกว่าขั้นต่ำหรือไม่ → แจ้งเตือน |
| `erp.audit.log` | ทุก API (fire-and-forget) | Audit Logger | บันทึก activity log ลง MongoDB — ไม่ block main request |

**ตัวอย่าง Flow**:
```
User กด Export รายงานยอดขายรายเดือนเป็น PDF
  → API publish message ไป erp.reports.generate
  → ตอบ user ทันที: "กำลังสร้างรายงาน, ระบบจะแจ้งเมื่อเสร็จ"
  → Report Worker รับ message → query DB → สร้าง PDF → publish ไป erp.notifications.send
  → Notification Worker → ส่งแจ้งเตือน user → user download PDF
```

---

## 5. Testing Strategy

โปรเจกต์นี้เน้นศึกษา Testing ทุกระดับ:

### 5.1 Testing Pyramid

```
     ╱ E2E ╲          ← Playwright (few, critical paths)
    ╱─────────╲
   ╱Integration╲       ← Supertest + Testcontainers (medium)
  ╱───────────────╲
 ╱   Unit Tests    ╲   ← Vitest (frontend) / Jest (backend) (many)
╱─────────────────────╲
```

### 5.2 Backend Testing

| Level | Tool | Scope | Example |
|-------|------|-------|---------|
| **Unit** | Jest + ts-jest | Services, Utils, Middleware | Test `sanitizeSql()` rejects DROP TABLE |
| **Integration** | Supertest + Testcontainers | API endpoints + real DB (throwaway container) | POST /api/invoices → check response + DB state |
| **Contract** | Jest | API response schema | Validates response shape matches Zod schema |

```ts
// Example: Integration Test Structure
describe('POST /api/customers', () => {
  let db: MySqlContainer;
  
  beforeAll(async () => {
    db = await new MySqlContainer().start(); // Testcontainers
    await migrate(db.getConnectionUri());
  });

  it('should create customer and return 201', async () => {
    const res = await request(app)
      .post('/api/customers')
      .send({ firstName: 'สมชาย', phone: '0812345678' })
      .expect(201);
    
    expect(res.body.id).toBeDefined();
    expect(res.body.firstName).toBe('สมชาย');
  });
});
```

### 5.3 Frontend Testing

| Level | Tool | Scope | Example |
|-------|------|-------|---------|
| **Unit** | Vitest + React Testing Library | Components, Hooks, Utils | Test `<InvoiceTable>` renders rows |
| **Integration** | Vitest + MSW (Mock Service Worker) | Pages with mocked API | Test `CustomerPage` loads and displays data |
| **E2E** | Playwright | Critical user flows | Login → Create Invoice → Check Dashboard |

```ts
// Example: Component Test
describe('<ChatPanel />', () => {
  it('should send message and display response', async () => {
    render(<ChatPanel />);
    await userEvent.type(screen.getByRole('textbox'), 'วันนี้ยอดขาย?');
    await userEvent.click(screen.getByRole('button', { name: 'ส่ง' }));
    
    expect(await screen.findByText('85,000 บาท')).toBeVisible();
  });
});
```

### 5.4 Test Coverage Target

| Layer | Unit | Integration | E2E |
|-------|------|-------------|-----|
| Backend Services | 80%+ | - | - |
| Backend API | - | 90%+ (all endpoints) | - |
| Frontend Components | 70%+ | - | - |
| Frontend Pages | - | 80%+ | - |
| Critical Flows | - | - | 5-8 scenarios |
| AI Chatbot | 85%+ (sanitizer, formatter) | 100% (chat endpoint) | 2-3 scenarios |

### 5.5 Test Commands

```bash
# Backend
cd backend
npm test                 # Unit tests
npm run test:integration # Integration tests (needs Docker)
npm run test:coverage    # Coverage report

# Frontend
cd frontend
npm test                 # Unit + Component tests (Vitest)
npm run test:e2e         # Playwright E2E tests (needs backend running)

# All together
npm run test:all         # Root script to run both
```

---

## 6. API Endpoints (Phase 1)

```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/customers
POST   /api/customers
GET    /api/customers/:id
PUT    /api/customers/:id
DELETE /api/customers/:id        ← soft delete (ต้องส่ง version)
POST   /api/customers/filter     ← pagination + filter
GET    /api/customers/:id/vehicles

GET    /api/inventory/products
POST   /api/inventory/products
GET    /api/inventory/products/:id
PUT    /api/inventory/products/:id   ← (ต้องส่ง version)
POST   /api/inventory/filter         ← pagination + filter
GET    /api/inventory/stock-movements
POST   /api/inventory/stock-movements/filter

GET    /api/sales/invoices
POST   /api/sales/invoices          ← transaction: invoice + items + stock
GET    /api/sales/invoices/:id
POST   /api/sales/invoices/filter    ← pagination + filter
GET    /api/sales/invoices/today-summary

GET    /api/jobs
POST   /api/jobs
GET    /api/jobs/:id
PUT    /api/jobs/:id/status          ← (ต้องส่ง version)
POST   /api/jobs/filter              ← pagination + filter
GET    /api/jobs/today-queue

POST   /api/chat/send          ← AI Chat
GET    /api/chat/history
POST   /api/chat/export        ← Export result as CSV/HTML
```

---

## 7. Frontend Routes (MVC)

```
/                          → Dashboard (ยอดวันนี้, คิวงาน, กราฟ)
/login                     → Login Page
/customers                 → Customer List + Search
/customers/:id             → Customer Detail + Vehicle List
/inventory                 → Product List (Stock)
/inventory/:id             → Product Detail + Stock Movement
/sales/invoices            → Invoice List
/sales/invoices/new        → Create Invoice
/sales/invoices/:id        → Invoice Detail
/jobs                      → Job Queue
/jobs/:id                  → Job Detail + Status Update
/chat                      → AI Chat Panel ★
/reports                   → Reports Dashboard (Phase 2)
/settings                  → User Settings
/admin/users               → User Management (Admin only)
```

---

## 8. Project Structure

ใช้รูปแบบ **Go-style Domain Modules** — 1 folder = 1 business domain, ทุกไฟล์ที่จำเป็นอยู่ด้วยกัน (entity, schema, handler, service, repo, route) แทนการแยก layer เป็น controllers/, services/, models/

```
erp-mcp-trainee/
├── docker-compose.yml           ← ALL infra services (MySQL, MongoDB, Redis, RabbitMQ)
├── spec/
│   ├── plan.md                  ← THIS FILE
│   └── ARCHITECTURE.md          ← Architecture + Go→TS mapping
├── .gitignore
│
├── frontend/                    ← React 19 + Vite + TypeScript (MVC Pattern)
│   ├── src/
│   │   ├── modules/              ← ⭐ React MVC: 1 folder = 1 domain
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   ├── model.ts      ← API calls + types (data layer)
│   │   │   │   ├── view.tsx       ← UI component (presentation)
│   │   │   │   └── controller.ts  ← Custom hook (state + logic)
│   │   │   │
│   │   │   ├── customer/
│   │   │   │   ├── model.ts      ← customerApi + CustomerEntity types
│   │   │   │   ├── view.tsx       ← CustomerList, CustomerDetail components
│   │   │   │   └── controller.ts  ← useCustomer, useCustomerList hooks
│   │   │   │
│   │   │   ├── inventory/
│   │   │   │   ├── model.ts, view.tsx, controller.ts
│   │   │   │
│   │   │   ├── invoice/
│   │   │   │   ├── model.ts, view.tsx, controller.ts
│   │   │   │
│   │   │   ├── job/
│   │   │   │   ├── model.ts, view.tsx, controller.ts
│   │   │   │
│   │   │   ├── chat/
│   │   │   │   ├── model.ts      ← chatApi + SSE streaming
│   │   │   │   ├── view.tsx       ← ChatPanel, MessageBubble, FormatSelector
│   │   │   │   └── controller.ts  ← useChat hook (send, stream, poll, export)
│   │   │   │
│   │   │   └── dashboard/
│   │   │       ├── model.ts, view.tsx, controller.ts
│   │   │
│   │   ├── shared/                ← Shared across modules
│   │   │   ├── components/        ← UI primitives (Button, Table, Dialog, Layout)
│   │   │   ├── hooks/             ← Generic hooks (useAuth, usePagination, useDebounce)
│   │   │   └── utils/             ← Formatters (currency, date, csvDownload)
│   │   │
│   │   ├── config/
│   │   │   └── api.ts             ← Axios/fetch instance + JWT interceptor
│   │   │
│   │   ├── stores/                ← Zustand global stores (auth, ui theme, sidebar)
│   │   │
│   │   ├── App.tsx
│   │   ├── router.tsx             ← React Router config (maps routes → views)
│   │   └── main.tsx
│   │
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                     ← Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/              ← DB pools, Redis, RabbitMQ, env loader
│   │   │   ├── database.ts      ← MySQL (Drizzle) + MongoDB connection
│   │   │   ├── redis.ts
│   │   │   ├── rabbitmq.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── modules/             ← ⭐ Go-style: 1 folder = 1 domain module
│   │   │   │
│   │   │   ├── user/            ← Auth + User Management
│   │   │   │   ├── entity.ts    ← DB model interface
│   │   │   │   ├── schema.ts    ← Zod validation + response DTOs
│   │   │   │   ├── handler.ts   ← HTTP handlers (class + methods)
│   │   │   │   ├── service.ts   ← Business logic (interface + impl)
│   │   │   │   ├── repo.ts      ← DB queries (interface + impl)
│   │   │   │   ├── route.ts     ← Express Router registration
│   │   │   │   └── user.test.ts
│   │   │   │
│   │   │   ├── customer/        ← CRM: Customers + Vehicles
│   │   │   │   ├── entity.ts, schema.ts, handler.ts
│   │   │   │   ├── service.ts, repo.ts, route.ts
│   │   │   │   └── customer.test.ts
│   │   │   │
│   │   │   ├── inventory/       ← Products, Stock, Categories
│   │   │   │   └── (same 6 files)
│   │   │   │
│   │   │   ├── invoice/         ← Sales, Quotations, Payments
│   │   │   │   └── (same 6 files)
│   │   │   │
│   │   │   ├── job/             ← Installation Jobs, Queue
│   │   │   │   └── (same 6 files)
│   │   │   │
│   │   │   ├── chat/            ← AI Chatbot (special: uses both MySQL + MongoDB)
│   │   │   │   ├── entity.ts, schema.ts, handler.ts
│   │   │   │   ├── service.ts   ← LLM integration + SQL generation
│   │   │   │   ├── repo_mysql.ts  ← Execute generated SQL (read-only)
│   │   │   │   ├── repo_mongo.ts  ← Chat history (MongoDB)
│   │   │   │   ├── sanitizer.ts   ← SQL read-only guard
│   │   │   │   ├── formatter.ts   ← CSV/HTML/JSON/Table output
│   │   │   │   ├── route.ts
│   │   │   │   └── chat.test.ts
│   │   │   │
│   │   │   └── dashboard/       ← Summary, KPIs, Charts
│   │   │       └── (same 6 files)
│   │   │
│   │   ├── shared/              ← Cross-cutting (≈ Go pkg/)
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts      ← JWT + Redis session verify
│   │   │   │   ├── rateLimit.ts ← Dev fallback (production → Nginx)
│   │   │   │   └── validator.ts ← Zod schema middleware
│   │   │   ├── errors/
│   │   │   │   └── AppError.ts  ← Custom error classes (NotFound, Unauthorized, Conflict)
│   │   │   ├── response/
│   │   │   │   └── handler.ts   ← Unified sendSuccess/sendError
│   │   │   ├── pagination/
│   │   │   │   └── helper.ts    ← Pagination calculator
│   │   │   └── mapper/
│   │   │       └── map.ts       ← Generic type mapper
│   │   │
│   │   ├── workers/             ← RabbitMQ Consumers (Async)
│   │   │   ├── reportWorker.ts
│   │   │   ├── notificationWorker.ts
│   │   │   ├── aiWorker.ts
│   │   │   └── auditWorker.ts
│   │   │
│   │   ├── router.ts            ← Central wiring (≈ internal/router/router.go)
│   │   └── app.ts               ← Express app entry
│   │
│   ├── tsconfig.json
│   ├── jest.config.ts
│   └── package.json
│
└── database/
    └── seeds/                   ← Seed data (customers, products, test invoices)
```

> **Architecture Philosophy**: อ่าน ARCHITECTURE.md สำหรับ Go→TypeScript concept mapping, module template, data flow diagrams เต็มๆ

---

## 9. Technology Stack Details

| Layer | Technology | Reason |
|-------|-----------|--------|
| **Frontend Framework** | React 19 + TypeScript | ตาม requirement |
| **Frontend Pattern** | MVC (Model-View-Controller) | module/model.ts, module/view.tsx, module/controller.ts |
| **Routing** | React Router v7 | File-based routing |
| **UI Library** | MUI (Material UI) v6 | Data-heavy components (Table, Form, Dialog) |
| **Styling** | Tailwind CSS v4 | Utility-first, custom layouts |
| **State Management** | Zustand | Simple, no boilerplate |
| **Charts** | Recharts | Dashboard charts |
| **Backend** | Node.js + Express 5 + TypeScript | Types in-box, no @types/express needed |
| **Architecture Pattern** | Go-style Domain Modules | 1 folder = 1 business domain (entity, schema, handler, service, repo, route) |
| **SQL Database** | MySQL 8.4 | Core business data, ACID, complex queries |
| **NoSQL Database** | MongoDB 7 | Chat history, activity logs, audit trail |
| **Cache** | Redis 7 | Dashboard cache, sessions, rate limiting, AI query cache |
| **Message Queue** | RabbitMQ 3.13 | Async jobs (reports, notifications, AI heavy queries, audit log) |
| **ORM (SQL)** | Drizzle ORM | Type-safe query builder, migration support |
| **ODM (NoSQL)** | Mongoose or native MongoDB driver | MongoDB document modeling |
| **Validation** | Zod | Runtime validation + Type inference (= Go validator tags) |
| **Auth** | JWT + bcrypt + Redis session | Server-side session for immediate revoke |
| **AI/LLM** | OpenAI API / Gemini API | Chatbot intent + SQL generation |
| **File Export** | json2csv + Puppeteer | CSV/PDF generation |
| **Infra** | Docker + Docker Compose | Local dev environment (all services) |
| **Testing — Backend Unit** | Jest + ts-jest | Service/util tests |
| **Testing — Backend Integration** | Supertest + Testcontainers | API + real DB tests |
| **Testing — Frontend Unit** | Vitest + React Testing Library | Component/hook tests |
| **Testing — API Mock** | MSW (Mock Service Worker) | Mock API in frontend integration tests |
| **Testing — E2E** | Playwright | Critical user flows |

---

## 10. Development Roadmap (ลำดับการทำ)

### Phase 1 — MVP + Testing (8-10 weeks)

```
Week 1-2: Setup Project + Docker Infra
  ├── Initialize frontend (Vite + React 19 + TypeScript + Router + MUI + Tailwind)
  ├── Initialize backend (Express + TypeScript, Go-style domain modules, ESLint + Prettier)
  ├── docker-compose.yml (MySQL, MongoDB, Redis, RabbitMQ)
  ├── DB schema + drizzle-kit generate/migrate: users, roles
  └── Auth system (login/logout/JWT + Redis sessions)

Week 3-4: Core Modules + Unit Tests
  ├── Customer Management CRUD + tests
  ├── Inventory Management CRUD + tests
  ├── Invoice CRUD + tests
  └── Job Management CRUD + status flow + tests

Week 5-6: AI Chatbot + Integration Tests
  ├── LLM integration (OpenAI/Gemini)
  ├── System prompt + DB schema injection
  ├── SQL generation + execution + sanitizer
  ├── Redis caching layer (AI cache, rate limit)
  ├── RabbitMQ integration (ai.expensive queue, audit.log)
  ├── MongoDB integration (chat history, activity logs)
  ├── Chat UI (Streaming, History, Format Selector)
  ├── Export (CSV, HTML, JSON)
  └── Integration tests for chat endpoint

Week 7-8: Dashboard + Integration Tests
  ├── Dashboard page (สรุปยอด, คิวงาน, กราฟ) with Redis cache
  ├── RabbitMQ: report generation queue + notification queue
  ├── Thai language i18n
  ├── Initial data seed
  └── API integration tests (all endpoints)

Week 9-10: E2E Testing + Polish
  ├── Playwright E2E tests (5-8 critical flows)
  ├── Bug fixes + UX polish
  ├── Test coverage report (>70%)
  └── MVP Complete 🎉
```

### Phase 2 — Extended Features (4-6 weeks)

```
Week 11-12: Procurement + Accounting
  ├── Supplier management + tests
  ├── Purchase orders + tests
  ├── Income/Expense tracking + tests
  └── Basic financial reports

Week 13-14: Advanced Features
  ├── Employee management + Commission + tests
  ├── Warranty tracking + tests
  ├── Advanced reports + PDF export via RabbitMQ worker
  └── Notification system (Line Notify via RabbitMQ)
```

### Phase 3 — Polish & Advanced (ongoing)

```
  ├── PWA / Mobile-responsive improvements
  ├── Advanced AI (forecast, recommendations)
  ├── Performance optimization (Redis caching strategy)
  ├── More E2E test coverage
  ├── DevOps setup (Nginx reverse proxy, TLS, rate limit at edge)
  └── Documentation (Thai + English)
```

---

## 11. Key Design Decisions / Considerations

### 11.1 AI Chatbot — Read-Only + Safe
- LLM จะ generate SQL queries ได้เฉพาะ **SELECT** เท่านั้น
- มี **SQL Sanitizer** ตรวจจับคำสั่งอันตราย (DROP, DELETE, UPDATE, INSERT, ALTER, TRUNCATE)
- มี **Rate Limiting** ป้องกัน abuse (e.g. 20 requests/min/user)
- ตั้ง **Query Timeout** 5 วินาที — ถ้า query นานเกินให้ตัดทิ้ง
- ทุก query ถูก **Log** ไว้เพื่อ audit

### 11.2 AI System Prompt Strategy
ส่ง DB Schema + Business Context ให้ LLM ทุกครั้ง:

```
You are an ERP assistant for Versus Thailand, a car gas installation company.
You translate user questions into MySQL queries.

Database schema:
[INSERT TABLE SCHEMAS HERE]

Rules:
1. Only SELECT queries. NEVER INSERT, UPDATE, DELETE, DROP, ALTER.
2. Always use LIMIT 100 unless user asks for more.
3. Use Thai-friendly column names. Dates are in Asia/Bangkok timezone.
4. Today = CURRENT_DATE at timezone 'Asia/Bangkok'
5. Respond in Thai language.
```

### 11.3 Response Format Switching
ผู้ใช้สามารถระบุ format ที่ต้องการ:
- `"Default"` → ตอบเป็นข้อความภาษาไทย + ตารางข้อมูล
- `"CSV"` → ส่งไฟล์ .csv
- `"HTML"` → ส่งเป็น HTML table
- `"JSON"` → ส่ง raw JSON (สำหรับ dev / API)

### 11.4 Multi-language
- UI: ไทย + อังกฤษ (toggle)
- AI Chat: รองรับทั้งถามไทยและอังกฤษ
- ข้อมูลใน DB: ไทยเป็นหลัก

### 11.5 Coding Rules (Mandatory)

มาตรฐานที่ห้ามละเมิด (ดูรายละเอียดใน `ARCHITECTURE.md` Section 9):

| # | Rule | Scope |
|---|------|-------|
| 1 | **Pagination Required** | ทุก list/filter endpoint ต้องรับ `page`, `page_size` + return `PaginationResponse` |
| 2 | **Transaction Required** | ทุก multi-table write (invoice+items+stock) ต้องใช้ `db.transaction()` |
| 3 | **Row Lock FOR UPDATE** | ทุก read-before-write ใน transaction ต้อง lock row |
| 4 | **Version Check** | ทุก PATCH/PUT/DELETE schema ต้องมี `version`, repo ต้อง `WHERE version = ?`, mismatch → 409 |

### 11.6 Why PostgreSQL > MySQL (สำหรับนำเสนอทีม)

ถ้าทีมที่ทำงานใหม่ยังไม่ได้ตัดสินใจ固定ใช้ MySQL — นี่คือประเด็นที่แนะนำให้ลองเสนอเปลี่ยนเป็น PostgreSQL:

| เรื่อง | MySQL 8.4 | PostgreSQL 16 | ทำไม PostgreSQL ดีกว่าใน ERP |
|--------|-----------|---------------|------------------------------|
| **Transaction Isolation** | REPEATABLE-READ (default) — มี phantom read | REPEATABLE-READ + SERIALIZABLE แท้ — ไม่มี phantom read | ERP ต้องแม่น 100% เช่น ตัดสต็อกพร้อมสร้างบิล — PostgreSQL การันตีความถูกต้องดีกว่า |
| **Row Locking** | InnoDB — ใช้ Gap Lock (ล็อก range) → ล็อกเกินจำเป็น → Deadlock ง่าย | MVCC จริง — ล็อกเฉพาะแถวที่ชนกันจริง | ระบบ ERP มี concurrent users หลายคน — PostgreSQL lock น้อยกว่า = ตายน้อยกว่า = throughput สูงกว่า |
| **JSON Support** | JSON (text-based, no index by default, query ช้า) | JSONB (binary, GIN index, query เร็วมาก) | product specifications ที่ใช้ JSON จะ query ได้เร็วกว่า + index ได้ |
| **Analytical Queries** | CTE, Window Function มีตั้งแต่ 8.0 แต่ optimizer ยังไม่เก่ง | CTE, Window Function, Lateral Join, optimizer ดีกว่า | หน้า Dashboard + Report ต้องการ Aggregate ซับซ้อน — PostgreSQL เร็วกว่า |
| **Extensions** | จำกัด — ส่วนใหญ่ต้องพึ่ง application layer | PostGIS, pg_trgm (Thai full-text search), pg_stat_statements | ค้นหาภาษาไทยด้วย pg_trgm, วิเคราะห์ performance ด้วย pg_stat_statements |
| **Data Integrity** | SQL Mode ไม่ strict โดย default — ตัดค่าอัตโนมัติ, แปลง type เงียบๆ | Strict by default — ใส่ผิด = error ทันที | ERP ต้องการความถูกต้องของข้อมูลสูง — PostgreSQL จับ bug ได้ตั้งแต่ต้น |
| **Concurrency** | Writer จะ block reader ในบางกรณี (locking) | MVCC — Writer/Reader ไม่ block กันเลย | Dashboard โหลดยอดขายสดขณะที่มีการเปิดบิล — PostgreSQL ไม่สะดุด |
| **Open Source** | Oracle ถือลิขสิทธิ์ — เคยมีประเด็น license | Community-owned (PostgreSQL Global Dev Group) — ปลอด license risk | ความเสี่ยงทาง license น้อยกว่า |

**สรุปให้ทีม**:
> "MySQL ใช้ได้ แต่ PostgreSQL เหมาะกับ ERP มากกว่าเพราะ transaction แน่นกว่า, lock ละเอียดกว่า, JSONB เร็วกว่า, และ extension ecosystem เหนือกว่า — โดยเฉพาะเรื่องความถูกต้องของข้อมูลซึ่งสำคัญมากในระบบบัญชีและสต็อก"

**Migration path**: ถ้าเริ่มด้วย MySQL แล้วอยากย้ายทีหลัง:
- Schema migration ตรงไปตรงมา (TABLE, INDEX ส่วนใหญ่เหมือนกัน)
- ใช้ pgLoader หรือ DBeaver ช่วย migrate ข้อมูล
- เปลี่ยน Drizzle dialect จาก `mysql` → `postgresql` (แก้ config บรรทัดเดียว)
- JSON column → JSONB (ดีขึ้น)

> **หมายเหตุ**: plan.md นี้ใช้ MySQL ตาม requirement ปัจจุบัน — แต่เนื้อหาส่วนนี้เตรียมไว้สำหรับใช้พูดคุยกับทีม

---

## 12. Potential Risks

| Risk | Mitigation |
|------|------------|
| LLM สร้าง SQL ผิดพลาด | Validate + retry logic, fallback to user-friendly error |
| LLM Cost สูงเกิน | ใช้ Gemini free tier / GPT-4o-mini / Caching frequent queries |
| ข้อมูลบริษัทหลุด (Privacy) | Self-host LLM option (Qwen 2.5), หรือใช้ API ที่มี data privacy policy |
| Scale ไม่รองรับ | MySQL สามารถรองรับ ERP ขนาด SME ได้ดี, ใช้ Connection Pooling |

---

## 13. Docker Compose Services

```yaml
# docker-compose.yml — Local Development Environment
# All services run locally, no production deployment

services:
  mysql:        # SQL — Core Business Data
  mongodb:      # NoSQL — Chat History, Activity Logs
  redis:        # Cache — Sessions, Dashboard, Rate Limit
  rabbitmq:     # Message Queue — Async Jobs
```

> ดู docker-compose.yml เต็มที่ `/erp-mcp-trainee/docker-compose.yml`

---

## 14. Next Steps

1. ✅ `plan.md` — เสร็จสิ้น (ไฟล์นี้)
2. ✅ `docker-compose.yml` — Done
3. 🔜 `ARCHITECTURE.md` — Detailed architecture + sequence diagrams
4. 🔜 `Project Setup` — Init frontend + backend repos
5. 🔜 `DB Design` — Finalize schema.ts + drizzle-kit generate + MongoDB indexes
6. 🔜 `Auth System` — Implement login + role management + tests
7. 🔜 `Core CRUD Modules` — Customers, Inventory, Invoices, Jobs + tests
8. 🔜 `AI Chatbot MVP` — LLM integration + chat UI + tests
9. 🔜 `Dashboard` — Summary + charts + Redis cache + tests
10. 🔜 `E2E Tests` — Playwright critical flows
11. 🔜 `DevOps` — Reverse proxy, TLS, rate limit (Phase 09 — reference only)

---

> **Status**: Draft v2.0 — 2026-07-18
> **Project Type**: Study/Learning — No Deployment
> **ทบทวนกับทีมก่อนเริ่ม Phase 1**
