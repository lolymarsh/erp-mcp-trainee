# Phase 07 — Dashboard

> **Priority**: 🟡 Medium
> **Estimate**: 1-2 days
> **Depends on**: Phase 02-05 (all data modules)

---

## Task 7.1 — Dashboard Backend (0.5 day)

**Files**: `backend/src/modules/dashboard/`

| File | Responsibility |
|------|---------------|
| `entity.ts` | KpiCard, ChartData, DashboardSummary |
| `schema.ts` | DashboardResponse |
| `handler.ts` | DashboardHandler: getSummary() |
| `service.ts` | DashboardService — aggregate from all modules + Redis cache |
| `repo.ts` | DashboardRepository — aggregate queries across tables |
| `route.ts` | GET /summary |

**Route**:
```
GET /api/dashboard/summary
```

**Response**:
```json
{
  "code": 200,
  "data": {
    "todaySales": { "amount": 85000, "count": 6 },
    "todayJobs": { "total": 8, "completed": 3, "inProgress": 2, "queued": 3 },
    "lowStockProducts": [{ "id": "...", "name": "ถังแก๊ส 58L", "current": 2, "min": 5 }],
    "monthlySales": [{ "month": "2026-07", "amount": 1250000 }],
    "topTechnicians": [{ "name": "สมชาย", "jobCount": 15, "totalAmount": 195000 }]
  }
}
```

**Redis Caching**:
```
dashboard:summary → cache 5 min
  - Cache miss: query all modules, aggregate, store in Redis
  - Cache hit: return from Redis instantly
  - Invalidate: on invoice create, job status change, stock adjust
```

---

## Task 7.2 — Dashboard Frontend (1 day)

**Files**: `frontend/src/modules/dashboard/`

| File | Responsibility |
|------|---------------|
| `model.ts` | dashboardApi.getSummary(), DashboardData types |
| `controller.ts` | useDashboard() — fetch summary, auto-refresh every 5 min |
| `view.tsx` | DashboardView — KPI cards + charts |

**Dashboard UI**:
- **Top Row**: 4 MUI Cards
  - ยอดขายวันนี้ (Today Sales): 85,000 บาท / 6 คัน
  - คิวงานวันนี้ (Today Jobs): 8 คิว / เสร็จ 3
  - สต็อกใกล้หมด (Low Stock): 3 รายการ (red alert)
  - รายได้เดือนนี้ (Monthly): 1,250,000 บาท

- **Middle Row**: 2 Charts (Recharts)
  - Bar Chart: ยอดขายรายเดือน (12 months)
  - Bar Chart: Top 5 ช่าง (by job count)

- **Bottom Row**: Low Stock Table (MUI DataGrid)

**Acceptance**:
- Summary loads on Dashboard page
- Numbers match actual DB data
- Auto-refresh every 5 min
- Click "สต็อกใกล้หมด" card → navigate to Inventory

---

## Phase 07 Checklist

```
[ ] GET /api/dashboard/summary → all 5 sections populated
[ ] Redis cache: first call queries DB, second call returns cached
[ ] Cache invalidates on invoice create / stock adjust
[ ] Frontend: 4 KPI cards + 2 charts + low stock table
[ ] Auto-refresh works (every 5 min)
[ ] Integration tests for dashboard endpoint
```

> **Next**: Phase 08 — E2E Tests + Final Polish
