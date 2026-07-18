import type Redis from "ioredis";
import type { IDashboardRepository } from "./repo";
import type { DashboardSummary } from "./entity";

const CACHE_KEY = "dashboard:summary";
const CACHE_TTL = 300;

export interface IDashboardService {
  getSummary(): Promise<DashboardSummary>;
  invalidateCache(): Promise<void>;
}

export class DashboardService implements IDashboardService {
  constructor(
    private repo: IDashboardRepository,
    private redis: Redis,
  ) {}

  async getSummary(): Promise<DashboardSummary> {
    const cached = await this.redis.get(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached) as DashboardSummary;
    }

    const [todaySales, todayJobs, lowStockProducts, monthlySales, topTechnicians] =
      await Promise.all([
        this.repo.getTodaySales(),
        this.repo.getTodayJobs(),
        this.repo.getLowStockProducts(),
        this.repo.getMonthlySales(),
        this.repo.getTopTechnicians(),
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

  async invalidateCache(): Promise<void> {
    await this.redis.del(CACHE_KEY);
  }
}
