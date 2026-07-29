import { api } from '../../config/api';

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

export const dashboardApi = {
  GetSummary: async (): Promise<DashboardSummary> => {
    const { data } = await api.get('/dashboard/summary');
    return data.data;
  },
};
