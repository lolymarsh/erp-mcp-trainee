import Redis from "ioredis";
import { DashboardService } from "./service";
import type { IDashboardRepository } from "./repo";
import type { DashboardSummary } from "./entity";

const mockSummary: DashboardSummary = {
  todaySales: { amount: "85000.00", count: 6 },
  todayJobs: { total: 8, completed: 3, inProgress: 2, queued: 3 },
  lowStockProducts: [
    { id: "p1", name: "ถังแก๊ส 58L", current: 2, min: 5 },
  ],
  monthlySales: [{ month: "2026-07", amount: "1250000.00" }],
  topTechnicians: [{ name: "สมชาย", jobCount: 15, totalAmount: "195000.00" }],
};

describe("DashboardService", () => {
  let repo: jest.Mocked<IDashboardRepository>;
  let redis: jest.Mocked<Redis>;
  let svc: DashboardService;

  beforeEach(() => {
    repo = {
      GetTodaySales: jest.fn(),
      GetTodayJobs: jest.fn(),
      GetLowStockProducts: jest.fn(),
      GetMonthlySales: jest.fn(),
      GetTopTechnicians: jest.fn(),
    };
    redis = {
      get: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
    } as unknown as jest.Mocked<Redis>;
    svc = new DashboardService(repo, redis);
  });

  describe("GetSummary", () => {
    it("should return cached data when cache hit", async () => {
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(mockSummary));

      const result = await svc.GetSummary();

      expect(result).toEqual(mockSummary);
      expect(repo.GetTodaySales).not.toHaveBeenCalled();
    });

    it("should aggregate from repo and cache when cache miss", async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      repo.GetTodaySales.mockResolvedValue(mockSummary.todaySales);
      repo.GetTodayJobs.mockResolvedValue(mockSummary.todayJobs);
      repo.GetLowStockProducts.mockResolvedValue(mockSummary.lowStockProducts);
      repo.GetMonthlySales.mockResolvedValue(mockSummary.monthlySales);
      repo.GetTopTechnicians.mockResolvedValue(mockSummary.topTechnicians);

      const result = await svc.GetSummary();

      expect(result).toEqual(mockSummary);
      expect(repo.GetTodaySales).toHaveBeenCalledTimes(1);
      expect(repo.GetTodayJobs).toHaveBeenCalledTimes(1);
      expect(repo.GetLowStockProducts).toHaveBeenCalledTimes(1);
      expect(repo.GetMonthlySales).toHaveBeenCalledTimes(1);
      expect(repo.GetTopTechnicians).toHaveBeenCalledTimes(1);
      expect(redis.setex).toHaveBeenCalledWith(
        "dashboard:summary",
        300,
        JSON.stringify(mockSummary),
      );
    });

    it("should handle empty data gracefully", async () => {
      const emptySummary: DashboardSummary = {
        todaySales: { amount: "0.00", count: 0 },
        todayJobs: { total: 0, completed: 0, inProgress: 0, queued: 0 },
        lowStockProducts: [],
        monthlySales: [],
        topTechnicians: [],
      };

      (redis.get as jest.Mock).mockResolvedValue(null);
      repo.GetTodaySales.mockResolvedValue(emptySummary.todaySales);
      repo.GetTodayJobs.mockResolvedValue(emptySummary.todayJobs);
      repo.GetLowStockProducts.mockResolvedValue(emptySummary.lowStockProducts);
      repo.GetMonthlySales.mockResolvedValue(emptySummary.monthlySales);
      repo.GetTopTechnicians.mockResolvedValue(emptySummary.topTechnicians);

      const result = await svc.GetSummary();

      expect(result.todaySales.amount).toBe("0.00");
      expect(result.todaySales.count).toBe(0);
      expect(result.lowStockProducts).toHaveLength(0);
      expect(result.monthlySales).toHaveLength(0);
      expect(result.topTechnicians).toHaveLength(0);
    });
  });

  describe("InvalidateCache", () => {
    it("should delete the cache key", async () => {
      await svc.InvalidateCache();
      expect(redis.del).toHaveBeenCalledWith("dashboard:summary");
    });
  });
});
