# 07 Dashboard — Schema & Cache Keys

> Dashboard has **no dedicated database tables**. All data is aggregated from other modules (invoices, jobs, products, users) via aggregate queries.

---

## Data Sources

| Dashboard Section | Source Table(s) | Module |
|-------------------|----------------|--------|
| todaySales | `invoices` | Invoice |
| todayJobs | `jobs`, `job_status_logs` | Job |
| lowStockProducts | `products` | Inventory |
| monthlySales | `invoices` | Invoice |
| topTechnicians | `jobs`, `users` | Job + User |

---

## Redis Cache Key Patterns

All dashboard data is cached in Redis to avoid expensive aggregate queries on every page load.

| Key Pattern | Type | TTL | Description |
|-------------|------|-----|-------------|
| `dashboard:summary:{userId}` | String (JSON) | 5 min | Full dashboard summary for a user |
| `dashboard:sales:today:{userId}` | String (JSON) | 5 min | Today sales summary |
| `dashboard:jobs:today:{userId}` | String (JSON) | 5 min | Today job queue summary |
| `dashboard:low_stock` | String (JSON) | 10 min | Low stock products list |
| `dashboard:monthly_sales` | String (JSON) | 10 min | Last 12 months sales |
| `dashboard:top_technicians` | String (JSON) | 10 min | Top 5 technicians |

### Cache Invalidation

```
Trigger                          Keys to Invalidate
─────────────────────────────────────────────────────────────
Invoice created                  dashboard:summary:*, dashboard:sales:today:*, dashboard:monthly_sales
Invoice updated/deleted          dashboard:summary:*, dashboard:sales:today:*, dashboard:monthly_sales
Job status changed               dashboard:summary:*, dashboard:jobs:today:*, dashboard:top_technicians
Job created                      dashboard:summary:*, dashboard:jobs:today:*
Product stock adjusted           dashboard:summary:*, dashboard:low_stock
Product created/updated/deleted  dashboard:low_stock
```

Implementation:

```ts
// shared/events/dashboard.ts
export async function invalidateDashboardCache(redis: Redis) {
  const keys = await redis.keys('dashboard:*');
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

// Called from:
//   invoice/service.ts → after create/update/delete
//   job/service.ts → after status change
//   inventory/service.ts → after stock adjust
```

---

## Entity Types (for reference)

These are defined in `entity.ts` and are aggregated types only — not stored in any database table.

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
  month: string;
  amount: number;
}

export interface TechnicianSummary {
  id: string;
  name: string;
  jobCount: number;
  totalAmount: number;
}
```

---

## Performance Considerations

| Concern | Mitigation |
|---------|-----------|
| Aggregate queries join many tables | Redis cache — queries execute at most every 5 min |
| Large invoice table (10k+ rows) | Monthly sales grouped by month avoids full table scan |
| Concurrent dashboard refreshes | Cache stampede protection: use `SET NX` with TTL |
| Stale data | Invalidation on every write operation ensures <5s staleness |
| Individual cache keys vs single key | Single `dashboard:summary` key is simpler; individual keys allow partial invalidation if needed |
