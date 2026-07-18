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
      getTodaySales: jest.fn(),
      getTodayJobs: jest.fn(),
      getLowStockProducts: jest.fn(),
      getMonthlySales: jest.fn(),
      getTopTechnicians: jest.fn(),
    };
    redis = {
      get: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
    } as unknown as jest.Mocked<Redis>;
    svc = new DashboardService(repo, redis);
  });

  describe("getSummary", () => {
    it("should return cached data when cache hit", async () => {
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(mockSummary));

      const result = await svc.getSummary();

      expect(result).toEqual(mockSummary);
      expect(repo.getTodaySales).not.toHaveBeenCalled();
    });

    it("should aggregate from repo and cache when cache miss", async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      repo.getTodaySales.mockResolvedValue(mockSummary.todaySales);
      repo.getTodayJobs.mockResolvedValue(mockSummary.todayJobs);
      repo.getLowStockProducts.mockResolvedValue(mockSummary.lowStockProducts);
      repo.getMonthlySales.mockResolvedValue(mockSummary.monthlySales);
      repo.getTopTechnicians.mockResolvedValue(mockSummary.topTechnicians);

      const result = await svc.getSummary();

      expect(result).toEqual(mockSummary);
      expect(repo.getTodaySales).toHaveBeenCalledTimes(1);
      expect(repo.getTodayJobs).toHaveBeenCalledTimes(1);
      expect(repo.getLowStockProducts).toHaveBeenCalledTimes(1);
      expect(repo.getMonthlySales).toHaveBeenCalledTimes(1);
      expect(repo.getTopTechnicians).toHaveBeenCalledTimes(1);
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
      repo.getTodaySales.mockResolvedValue(emptySummary.todaySales);
      repo.getTodayJobs.mockResolvedValue(emptySummary.todayJobs);
      repo.getLowStockProducts.mockResolvedValue(emptySummary.lowStockProducts);
      repo.getMonthlySales.mockResolvedValue(emptySummary.monthlySales);
      repo.getTopTechnicians.mockResolvedValue(emptySummary.topTechnicians);

      const result = await svc.getSummary();

      expect(result.todaySales.amount).toBe("0.00");
      expect(result.todaySales.count).toBe(0);
      expect(result.lowStockProducts).toHaveLength(0);
      expect(result.monthlySales).toHaveLength(0);
      expect(result.topTechnicians).toHaveLength(0);
    });
  });

  describe("invalidateCache", () => {
    it("should delete the cache key", async () => {
      await svc.invalidateCache();
      expect(redis.del).toHaveBeenCalledWith("dashboard:summary");
    });
  });
});
