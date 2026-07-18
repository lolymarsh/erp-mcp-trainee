export interface TodaySalesData {
  amount: string;
  count: number;
}

export interface TodayJobsData {
  total: number;
  completed: number;
  inProgress: number;
  queued: number;
}

export interface LowStockProduct {
  id: string;
  name: string;
  current: number;
  min: number;
}

export interface MonthlySalesItem {
  month: string;
  amount: string;
}

export interface TopTechnicianItem {
  name: string;
  jobCount: number;
  totalAmount: string;
}

export interface DashboardSummary {
  todaySales: TodaySalesData;
  todayJobs: TodayJobsData;
  lowStockProducts: LowStockProduct[];
  monthlySales: MonthlySalesItem[];
  topTechnicians: TopTechnicianItem[];
}
