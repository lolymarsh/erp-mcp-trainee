import type Redis from "ioredis";
import type { IDashboardRepository } from "./repo";
import type { DashboardSummary } from "./entity";

const CACHE_KEY = "dashboard:summary";
const CACHE_TTL = 300;

export interface IDashboardService {
  GetSummary(): Promise<DashboardSummary>;
  InvalidateCache(): Promise<void>;
}

export class DashboardService implements IDashboardService {
  constructor(
    private repo: IDashboardRepository,
    private redis: Redis,
  ) {}

  async GetSummary(): Promise<DashboardSummary> {
    const cached = await this.redis.get(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached) as DashboardSummary;
    }

    const [todaySales, todayJobs, lowStockProducts, monthlySales, topTechnicians] =
      await Promise.all([
        this.repo.GetTodaySales(),
        this.repo.GetTodayJobs(),
        this.repo.GetLowStockProducts(),
        this.repo.GetMonthlySales(),
        this.repo.GetTopTechnicians(),
      ]);

    const summary: DashboardSummary = {
      todaySales,
      todayJobs,
      lowStockProducts,
      monthlySales,
      topTechnicians,
    };

    await this.redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(summary));

    return summary;
  }

  async InvalidateCache(): Promise<void> {
    await this.redis.del(CACHE_KEY);
  }
}
