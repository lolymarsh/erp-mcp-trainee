/* eslint-disable @typescript-eslint/no-explicit-any */
import { DashboardRepository } from "./repo";

function createMockDb() {
  return {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
  } as any;
}

describe("DashboardRepository", () => {
  let db: ReturnType<typeof createMockDb>;
  let repo: DashboardRepository;

  beforeEach(() => {
    db = createMockDb();
    repo = new DashboardRepository(db);
  });

  describe("GetTodaySales", () => {
    it("should return sales data for today", async () => {
      db.where = jest.fn().mockResolvedValue([
        { amount: "85000.00", count: 6 },
      ]);

      const result = await repo.GetTodaySales();

      expect(result.amount).toBe("85000.00");
      expect(result.count).toBe(6);
    });

    it("should return zeros when no sales today", async () => {
      db.where = jest.fn().mockResolvedValue([]);

      const result = await repo.GetTodaySales();

      expect(result.amount).toBe("0.00");
      expect(result.count).toBe(0);
    });
  });

  describe("GetTodayJobs", () => {
    it("should return job counts grouped by status", async () => {
      db.where = jest.fn().mockReturnThis();
      db.groupBy = jest.fn().mockResolvedValue([
        { status: "COMPLETED", count: 3 },
        { status: "IN_PROGRESS", count: 2 },
        { status: "QUEUED", count: 5 },
      ]);

      const result = await repo.GetTodayJobs();

      expect(result.total).toBe(10);
      expect(result.completed).toBe(3);
      expect(result.inProgress).toBe(2);
      expect(result.queued).toBe(5);
    });

    it("should return zeros when no jobs today", async () => {
      db.where = jest.fn().mockReturnThis();
      db.groupBy = jest.fn().mockResolvedValue([]);

      const result = await repo.GetTodayJobs();

      expect(result.total).toBe(0);
      expect(result.completed).toBe(0);
      expect(result.inProgress).toBe(0);
      expect(result.queued).toBe(0);
    });

    it("should handle partial statuses", async () => {
      db.where = jest.fn().mockReturnThis();
      db.groupBy = jest.fn().mockResolvedValue([
        { status: "COMPLETED", count: 2 },
      ]);

      const result = await repo.GetTodayJobs();

      expect(result.total).toBe(2);
      expect(result.completed).toBe(2);
      expect(result.inProgress).toBe(0);
      expect(result.queued).toBe(0);
    });
  });

  describe("GetLowStockProducts", () => {
    it("should return products where stock < min stock", async () => {
      db.where = jest.fn().mockReturnThis();
      db.orderBy = jest.fn().mockResolvedValue([
        { id: "p1", name: "Product A", current: 2, min: 5 },
        { id: "p2", name: "Product B", current: 0, min: 3 },
      ]);

      const result = await repo.GetLowStockProducts();

      expect(result).toHaveLength(2);
      expect(result[0].current).toBe(2);
      expect(result[1].current).toBe(0);
    });

    it("should return empty array when no low stock", async () => {
      db.where = jest.fn().mockReturnThis();
      db.orderBy = jest.fn().mockResolvedValue([]);

      const result = await repo.GetLowStockProducts();

      expect(result).toHaveLength(0);
    });
  });

  describe("GetMonthlySales", () => {
    it("should return 12 months of sales data", async () => {
      db.where = jest.fn().mockReturnThis();
      db.groupBy = jest.fn().mockReturnThis();
      db.orderBy = jest.fn().mockResolvedValue([
        { month: "2026-07", amount: "1250000.00" },
      ]);

      const result = await repo.GetMonthlySales();

      expect(result.length).toBeGreaterThanOrEqual(12);
      expect(result.some((r) => r.month === "2026-07")).toBe(true);
      expect(result.some((r) => r.amount !== "0.00")).toBe(true);
    });
  });

  describe("GetTopTechnicians", () => {
    it("should return top 5 technicians", async () => {
      db.where = jest.fn().mockReturnThis();
      db.innerJoin = jest.fn().mockReturnThis();
      db.leftJoin = jest.fn().mockReturnThis();
      db.groupBy = jest.fn().mockReturnThis();
      db.orderBy = jest.fn().mockReturnThis();
      db.limit = jest.fn().mockResolvedValue([
        { name: "สมชาย", jobCount: 15, totalAmount: "195000.00" },
        { name: "สมหญิง", jobCount: 10, totalAmount: "120000.00" },
      ]);

      const result = await repo.GetTopTechnicians();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("สมชาย");
      expect(result[0].totalAmount).toBe("195000.00");
    });

    it("should return empty array when no completed jobs", async () => {
      db.where = jest.fn().mockReturnThis();
      db.innerJoin = jest.fn().mockReturnThis();
      db.leftJoin = jest.fn().mockReturnThis();
      db.groupBy = jest.fn().mockReturnThis();
      db.orderBy = jest.fn().mockReturnThis();
      db.limit = jest.fn().mockResolvedValue([]);

      const result = await repo.GetTopTechnicians();

      expect(result).toHaveLength(0);
    });
  });
});
