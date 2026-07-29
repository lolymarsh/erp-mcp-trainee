import type { Request, Response } from "express";
import { DashboardHandler } from "./handler";
import type { IDashboardService } from "./service";
import { AppError } from "../../shared/errors/AppError";

function mockReqRes() {
  const req = {} as unknown as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return { req, res };
}

const mockSummary = {
  todaySales: { amount: "85000.00", count: 6 },
  todayJobs: { total: 8, completed: 3, inProgress: 2, queued: 3 },
  lowStockProducts: [{ id: "p1", name: "ถังแก๊ส 58L", current: 2, min: 5 }],
  monthlySales: [{ month: "2026-07", amount: "1250000.00" }],
  topTechnicians: [{ name: "สมชาย", jobCount: 15, totalAmount: "195000.00" }],
};

describe("DashboardHandler", () => {
  let svc: jest.Mocked<IDashboardService>;
  let handler: DashboardHandler;

  beforeEach(() => {
    svc = {
      GetSummary: jest.fn(),
      InvalidateCache: jest.fn(),
    };
    handler = new DashboardHandler(svc);
  });

  describe("GetSummary", () => {
    it("should return 200 with summary on success", async () => {
      svc.GetSummary.mockResolvedValue(mockSummary);
      const { req, res } = mockReqRes();

      await handler.GetSummary(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        code: 200,
        message: "success",
        data: mockSummary,
      });
    });

    it("should handle AppError", async () => {
      svc.GetSummary.mockRejectedValue(new AppError(500, "Dashboard error", { reason: "db" }));
      const { req, res } = mockReqRes();

      await handler.GetSummary(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        code: 500,
        message: "Dashboard error",
        details: { reason: "db" },
      });
    });

    it("should handle unexpected error as 500", async () => {
      svc.GetSummary.mockRejectedValue(new Error("unexpected"));
      const { req, res } = mockReqRes();

      await handler.GetSummary(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        code: 500,
        message: "Internal server error",
      });
    });
  });
});
