import { eq, and, gte, lt, isNull, count, sql, desc, asc } from "drizzle-orm";
import type { MySql2Database } from "drizzle-orm/mysql2";
import {
  invoices,
  jobs,
  products,
  users,
} from "../../config/schema";
import type {
  TodaySalesData,
  TodayJobsData,
  LowStockProduct,
  MonthlySalesItem,
  TopTechnicianItem,
} from "./entity";

export interface IDashboardRepository {
  getTodaySales(): Promise<TodaySalesData>;
  getTodayJobs(): Promise<TodayJobsData>;
  getLowStockProducts(): Promise<LowStockProduct[]>;
  getMonthlySales(): Promise<MonthlySalesItem[]>;
  getTopTechnicians(): Promise<TopTechnicianItem[]>;
}

export class DashboardRepository implements IDashboardRepository {
  constructor(private db: MySql2Database) {}

  async getTodaySales(): Promise<TodaySalesData> {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    );

    const result = await this.db
      .select({
        amount: sql<string>`CAST(COALESCE(SUM(${invoices.grandTotal}), 0) AS CHAR)`,
        count: count(),
      })
      .from(invoices)
      .where(
        and(gte(invoices.createdAt, startOfDay), lt(invoices.createdAt, endOfDay)),
      );

    return {
      amount: result[0]?.amount ?? "0.00",
      count: result[0]?.count ?? 0,
    };
  }

  async getTodayJobs(): Promise<TodayJobsData> {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    );

    const result = await this.db
      .select({ status: jobs.status, count: count() })
      .from(jobs)
      .where(
        and(gte(jobs.createdAt, startOfDay), lt(jobs.createdAt, endOfDay)),
      )
      .groupBy(jobs.status);

    let completed = 0;
    let inProgress = 0;
    let queued = 0;

    for (const row of result) {
      switch (row.status) {
        case "COMPLETED":
          completed = row.count;
          break;
        case "IN_PROGRESS":
          inProgress = row.count;
          break;
        case "QUEUED":
          queued = row.count;
          break;
      }
    }

    const total = completed + inProgress + queued;

    return { total, completed, inProgress, queued };
  }

  async getLowStockProducts(): Promise<LowStockProduct[]> {
    const result = await this.db
      .select({
        id: products.id,
        name: products.name,
        current: products.currentStock,
        min: products.minStock,
      })
      .from(products)
      .where(
        and(
          sql`${products.currentStock} < ${products.minStock}`,
          isNull(products.deletedAt),
        ),
      )
      .orderBy(asc(products.currentStock));

    return result.map((r) => ({
      id: r.id,
      name: r.name,
      current: r.current ?? 0,
      min: r.min ?? 0,
    }));
  }

  async getMonthlySales(): Promise<MonthlySalesItem[]> {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const result = await this.db
      .select({
        month: sql<string>`DATE_FORMAT(${invoices.createdAt}, '%Y-%m')`,
        amount: sql<string>`CAST(COALESCE(SUM(${invoices.grandTotal}), 0) AS CHAR)`,
      })
      .from(invoices)
      .where(gte(invoices.createdAt, twelveMonthsAgo))
      .groupBy(sql`DATE_FORMAT(${invoices.createdAt}, '%Y-%m')`)
      .orderBy(asc(sql`DATE_FORMAT(${invoices.createdAt}, '%Y-%m')`));

    const monthMap = new Map<string, string>();
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap.set(key, "0.00");
    }

    for (const row of result) {
      monthMap.set(row.month, row.amount);
    }

    return Array.from(monthMap.entries()).map(([month, amount]) => ({
      month,
      amount,
    }));
  }

  async getTopTechnicians(): Promise<TopTechnicianItem[]> {
    const result = await this.db
      .select({
        name: users.displayName,
        jobCount: count(jobs.id),
        totalAmount: sql<string>`CAST(COALESCE(COALESCE(SUM(${invoices.grandTotal}), 0), 0) AS CHAR)`,
      })
      .from(jobs)
      .innerJoin(users, eq(jobs.technicianId, users.id))
      .leftJoin(invoices, eq(jobs.invoiceId, invoices.id))
      .where(
        and(
          eq(jobs.status, "COMPLETED"),
          isNull(users.deletedAt),
        ),
      )
      .groupBy(jobs.technicianId, users.displayName)
      .orderBy(desc(count(jobs.id)))
      .limit(5);

    return result.map((r) => ({
      name: r.name,
      jobCount: r.jobCount ?? 0,
      totalAmount: r.totalAmount ?? "0.00",
    }));
  }
}
