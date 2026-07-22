# Phase 07 — Dashboard

> **Priority**: 🟡 Medium
> **Estimate**: 1-2 days
> **Depends on**: Phase 02-05 (all data modules — customers, inventory, invoices, jobs)

---

## Overview

Dashboard aggregates KPI data from all business modules and presents it in a single summary view. Data is cached in Redis for fast loads and invalidated when underlying data changes.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   Frontend (React)                       │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │              DashboardView                         │  │
│  │                                                    │  │
│  │  Top Row: 4 KPI Cards                              │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │  │
│  │  │ ยอดขาย  │ │ คิวงาน   │ │ สต็อก   │ │ รายได้   │ │  │
│  │  │ วันนี้   │ │ วันนี้   │ │ ใกล้หมด  │ │ เดือนนี้ │ │  │
│  │  │ 85,000  │ │ 8 คิว    │ │ 3 รายการ│ │ 1.25M   │ │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ │  │
│  │                                                    │  │
│  │  Middle Row: 2 Charts (Recharts)                   │  │
│  │  ┌──────────────────┐  ┌──────────────────┐       │  │
│  │  │ Bar Chart:        │  │ Bar Chart:        │       │  │
│  │  │ ยอดขายรายเดือน   │  │ Top 5 ช่าง        │       │  │
│  │  │ (12 months)       │  │ (by job count)    │       │  │
│  │  └──────────────────┘  └──────────────────┘       │  │
│  │                                                    │  │
│  │  Bottom Row: Low Stock Table (MUI DataGrid)        │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │ Product     │ Stock │ Min │ Status           │  │  │
│  │  │ ถังแก๊ส 58L  │ 2     │ 5   │ 🔴 ต่ำกว่าจุดสั่ง│  │  │
│  │  │ ECU X100    │ 1     │ 3   │ 🔴 ต่ำกว่าจุดสั่ง│  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────────────┘
                           │ GET /api/dashboard/summary
┌──────────────────────────▼───────────────────────────────┐
│                   Backend (Express)                       │
│                                                           │
│  DashboardService.getSummary():                             │
│    1. Check Redis: dashboard:summary                      │
│       → Cache HIT → return instantly                      │
│       → Cache MISS → proceed to step 2                    │
│    2. Aggregate from all modules:                          │
│       • todaySales: invoices grouped by today              │
│       • todayJobs: jobs grouped by status                  │
│       • lowStockProducts: WHERE current_stock < min_stock  │
│       • monthlySales: invoices grouped by month             │
│       • topTechnicians: jobs grouped by technician          │
│    3. Store in Redis: dashboard:summary (TTL 5 min)        │
│    4. Return aggregated result                             │
│                                                           │
│  Cache Invalidation:                                      │
│    • On invoice create → delete dashboard:summary          │
│    • On job status change → delete dashboard:summary       │
│    • On stock adjust → delete dashboard:summary             │
│    • On product update → delete dashboard:summary           │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## Task 1 — Dashboard Backend

**Files**: `backend/src/modules/dashboard/`

| File | Responsibility |
|------|---------------|
| `entity.ts` | KpiCard, ChartData, DashboardSummary interfaces |
| `schema.ts` | DashboardResponse |
| `handler.ts` | DashboardHandler: getSummary() |
| `service.ts` | DashboardService — aggregate from all modules + Redis cache |
| `repo.ts` | DashboardRepository — aggregate queries across tables |
| `route.ts` | GET /summary |

### Route

```
GET /api/dashboard/summary
```

### Response Shape

```json
{
  "code": 200,
  "data": {
    "todaySales": {
      "amount": 85000,
      "count": 6
    },
    "todayJobs": {
      "total": 8,
      "completed": 3,
      "inProgress": 2,
      "queued": 3
    },
    "lowStockProducts": [
      {
        "id": "...",
        "name": "ถังแก๊ส 58L",
        "sku": "TANK-58L",
        "currentStock": 2,
        "minStock": 5,
        "unit": "ใบ"
      }
    ],
    "monthlySales": [
      { "month": "2026-01", "amount": 850000 },
      { "month": "2026-02", "amount": 920000 }
    ],
    "topTechnicians": [
      { "id": "...", "name": "สมชาย", "jobCount": 15, "totalAmount": 195000 }
    ]
  }
}
```

### Entity Interfaces

```ts
export interface DashboardSummary {
  todaySales: TodaySales;
  todayJobs: TodayJobs;
  lowStockProducts: LowStockProduct[];
  monthlySales: MonthlySales[];
  topTechnicians: TechnicianSummary[];
}

export interface TodaySales {
  amount: number;
  count: number;
}

export interface TodayJobs {
  total: number;
  completed: number;
  inProgress: number;
  queued: number;
}

export interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minStock: number;
  unit: string;
}

export interface MonthlySales {
  month: string;   // "2026-01"
  amount: number;
}

export interface TechnicianSummary {
  id: string;
  name: string;
  jobCount: number;
  totalAmount: number;
}
```

### Redis Caching Strategy

```
Key: dashboard:summary
TTL: 300 seconds (5 min)

Flow:
  1. Request comes in
  2. Check Redis for dashboard:summary
  3. Cache HIT → parse JSON → return
  4. Cache MISS → query all modules → aggregate
     → store in Redis with TTL 300s
     → return result

Invalidation triggers:
  - Invoice created → del dashboard:summary
  - Job status changed → del dashboard:summary
  - Stock adjusted → del dashboard:summary
  - Product updated → del dashboard:summary
```

---

## Task 2 — Dashboard Frontend

**Files**: `frontend/src/modules/dashboard/`

| File | Responsibility |
|------|---------------|
| `model.ts` | dashboardApi.getSummary(), DashboardData types |
| `controller.ts` | useDashboard() — fetch summary, auto-refresh every 5 min |
| `view.tsx` | DashboardView — KPI cards + charts |

### useDashboard() Hook

```ts
export function useDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dashboardApi.getSummary();
      setSummary(data);
    } catch (err) {
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 300000); // 5 min auto-refresh
    return () => clearInterval(interval);
  }, [fetchSummary]);

  return { summary, loading, error, refetch: fetchSummary };
}
```

### DashboardView Layout

**Top Row**: 4 MUI Cards
| Card | Content | Icon | Action |
|------|---------|------|--------|
| ยอดขายวันนี้ | 85,000 บาท / 6 คัน | 💰 | — |
| คิวงานวันนี้ | 8 คิว / เสร็จ 3 | 🔧 | Click → /jobs |
| สต็อกใกล้หมด | 3 รายการ | ⚠️ (red alert) | Click → /inventory |
| รายได้เดือนนี้ | 1,250,000 บาท | 📈 | — |

**Middle Row**: 2 Recharts Bar Charts
- Monthly Sales (12 months, blue bars)
- Top 5 Technicians (by job count, green bars)

**Bottom Row**: Low Stock Table (MUI DataGrid)
- Columns: ชื่อสินค้า, คงเหลือ, ขั้นต่ำ, สถานะ
- Red highlight when current_stock < min_stock

---

## Aggregate Query Examples

### Today Sales

```sql
SELECT COALESCE(SUM(grand_total), 0) as amount, COUNT(*) as count
FROM invoices
WHERE DATE(created_at) = CURDATE()
  AND deleted_at IS NULL;
```

### Today Jobs by Status

```sql
SELECT
  COUNT(*) as total,
  SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress,
  SUM(CASE WHEN status = 'QUEUED' THEN 1 ELSE 0 END) as queued
FROM jobs
WHERE DATE(scheduled_date) = CURDATE()
  AND deleted_at IS NULL;
```

### Low Stock Products

```sql
SELECT id, name, sku, current_stock, min_stock, unit
FROM products
WHERE current_stock < min_stock
  AND deleted_at IS NULL
ORDER BY (current_stock / min_stock) ASC;
```

### Monthly Sales (12 months)

```sql
SELECT DATE_FORMAT(created_at, '%Y-%m') as month, SUM(grand_total) as amount
FROM invoices
WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
  AND deleted_at IS NULL
GROUP BY DATE_FORMAT(created_at, '%Y-%m')
ORDER BY month ASC;
```

### Top Technicians

```sql
SELECT
  u.id,
  u.display_name as name,
  COUNT(j.id) as job_count,
  COALESCE(SUM(j.total_amount), 0) as total_amount
FROM jobs j
JOIN users u ON j.technician_id = u.id
WHERE j.status = 'COMPLETED'
  AND j.deleted_at IS NULL
  AND j.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY u.id, u.display_name
ORDER BY job_count DESC
LIMIT 5;
```

---

## Acceptance Criteria

- Summary loads on Dashboard page
- Numbers match actual DB data
- Redis cache: first call queries DB, second call returns cached
- Cache invalidates on invoice create / stock adjust
- Auto-refresh every 5 min
- Click "สต็อกใกล้หมด" card → navigate to /inventory
- Click "คิวงานวันนี้" card → navigate to /jobs
- All 4 KPI cards, 2 charts, and low stock table render correctly

---

## Task Checklist

```
[ ] GET /api/dashboard/summary → all 5 sections populated
[ ] Redis cache: first call queries DB, second call returns cached
[ ] Cache invalidates on invoice create / stock adjust
[ ] todaySales: amount + count for today
[ ] todayJobs: total + completed + inProgress + queued
[ ] lowStockProducts: products below min threshold
[ ] monthlySales: last 12 months bar chart data
[ ] topTechnicians: top 5 by completed jobs (last 30 days)
[ ] Frontend: 4 KPI cards + 2 charts + low stock table
[ ] KPI cards with MUI Paper + icons
[ ] Monthly sales bar chart (Recharts)
[ ] Top technicians bar chart (Recharts)
[ ] Low stock DataGrid with red highlight
[ ] Auto-refresh works (every 5 min)
[ ] Integration tests for dashboard endpoint
[ ] Unit tests for aggregate service
```

---

> **Next**: Phase 08 — E2E Tests + Final Polish
