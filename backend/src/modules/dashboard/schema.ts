import type { DashboardSummary } from "./entity";

export interface DashboardResponse {
  todaySales: {
    amount: string;
    count: number;
  };
  todayJobs: {
    total: number;
    completed: number;
    inProgress: number;
    queued: number;
  };
  lowStockProducts: Array<{
    id: string;
    name: string;
    current: number;
    min: number;
  }>;
  monthlySales: Array<{
    month: string;
    amount: string;
  }>;
  topTechnicians: Array<{
    name: string;
    jobCount: number;
    totalAmount: string;
  }>;
}

export type { DashboardSummary };
