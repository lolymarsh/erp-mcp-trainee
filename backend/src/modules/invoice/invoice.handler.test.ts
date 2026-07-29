import type { Request, Response } from "express";
import { InvoiceHandler } from "./handler";
import type { IInvoiceService } from "./service";
import { AppError } from "../../shared/errors/AppError";

function mockReqRes() {
  const req = { body: {}, params: {}, user: undefined } as unknown as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return { req, res };
}

describe("InvoiceHandler", () => {
  let svc: jest.Mocked<IInvoiceService>;
  let handler: InvoiceHandler;

  beforeEach(() => {
    svc = {
      Filter: jest.fn(),
      GetById: jest.fn(),
      Create: jest.fn(),
      GetTodaySummary: jest.fn(),
      UpdatePaymentStatus: jest.fn(),
    };
    handler = new InvoiceHandler(svc);
  });

  describe("filter", () => {
    it("should return 200 with data and pagination", async () => {
      svc.Filter.mockResolvedValue({ data: [], pagination: { page: 1, pageSize: 20, totalData: 0, totalPage: 0, hasNextPage: false, hasPreviousPage: false } });
      const { req, res } = mockReqRes();
      req.body = { page: 1, pageSize: 20, filters: [] };
      await handler.Filter(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getById", () => {
    it("should return 200 with invoice", async () => {
      svc.GetById.mockResolvedValue({
        id: "inv-1", invoiceNumber: "INV-001", customerId: "c1", vehicleId: null,
        totalAmount: "5000", discount: "0", tax: "0", grandTotal: "5000",
        paymentStatus: "PENDING", paymentMethod: null, createdBy: "u1", version: 1,
        createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
        items: [],
      });
      const { req, res } = mockReqRes();
      req.params = { id: "inv-1" };
      await handler.GetById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should handle extractId with array params", async () => {
      svc.GetById.mockResolvedValue({
        id: "inv-1", invoiceNumber: "INV-001", customerId: "c1", vehicleId: null,
        totalAmount: "5000", discount: "0", tax: "0", grandTotal: "5000",
        paymentStatus: "PENDING", paymentMethod: null, createdBy: "u1", version: 1,
        createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
        items: [],
      });
      const { req, res } = mockReqRes();
      req.params = { id: ["inv-1", "inv-2"] } as unknown as Record<string, string>;
      await handler.GetById(req, res);
      expect(svc.GetById).toHaveBeenCalledWith("inv-1");
    });
  });

  describe("create", () => {
    it("should return 201 with userId from req.user", async () => {
      svc.Create.mockResolvedValue({
        id: "inv-1", invoiceNumber: "INV-001", customerId: "c1", vehicleId: null,
        totalAmount: "5000", discount: "0", tax: "0", grandTotal: "5000",
        paymentStatus: "PENDING", paymentMethod: null, createdBy: "u1", version: 1,
        createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
        items: [],
      });
      const { req, res } = mockReqRes();
      req.body = { customerId: "c1", items: [{ productId: "p1", quantity: 1 }] };
      req.user = { userId: "u1", role: "ADMIN" };
      await handler.Create(req, res);
      expect(svc.Create).toHaveBeenCalledWith(expect.any(Object), "u1", undefined);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should use system when no req.user", async () => {
      svc.Create.mockResolvedValue({
        id: "inv-2", invoiceNumber: "INV-002", customerId: "c1", vehicleId: null,
        totalAmount: "3000", discount: "0", tax: "0", grandTotal: "3000",
        paymentStatus: "PENDING", paymentMethod: null, createdBy: "system", version: 1,
        createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
        items: [],
      });
      const { req, res } = mockReqRes();
      req.body = { customerId: "c1", items: [{ productId: "p1", quantity: 1 }] };
      await handler.Create(req, res);
      expect(svc.Create).toHaveBeenCalledWith(expect.any(Object), "system", undefined);
    });
  });

  describe("todaySummary", () => {
    it("should return 200 with summary", async () => {
      svc.GetTodaySummary.mockResolvedValue({ totalAmount: "15000.00", count: 3 });
      const { req, res } = mockReqRes();
      await handler.TodaySummary(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("error cases", () => {
    it("should handle AppError", async () => {
      svc.GetById.mockRejectedValue(new AppError(404, "Invoice not found"));
      const { req, res } = mockReqRes();
      req.params = { id: "nonexistent" };
      await handler.GetById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should handle ZodError", async () => {
      const { req, res } = mockReqRes();
      req.body = {};
      await handler.Create(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should handle unexpected error as 500", async () => {
      svc.Filter.mockRejectedValue(new Error("unexpected"));
      const { req, res } = mockReqRes();
      req.body = { page: 1, pageSize: 20, filters: [] };
      await handler.Filter(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("should handle AppError in filter", async () => {
      svc.Filter.mockRejectedValue(new AppError(400, "Invalid filter"));
      const { req, res } = mockReqRes();
      req.body = { page: 1, pageSize: 20 };
      await handler.Filter(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should handle ZodError in filter", async () => {
      const { req, res } = mockReqRes();
      req.body = { page: "abc" };
      await handler.Filter(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should handle 500 in getById", async () => {
      svc.GetById.mockRejectedValue(new Error("unexpected"));
      const { req, res } = mockReqRes();
      req.params = { id: "inv-1" };
      await handler.GetById(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("should handle AppError in create", async () => {
      svc.Create.mockRejectedValue(new AppError(400, "Invalid data"));
      const { req, res } = mockReqRes();
      req.body = { customerId: "c1", items: [{ productId: "p1", quantity: 1 }] };
      await handler.Create(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should handle 500 in create", async () => {
      svc.Create.mockRejectedValue(new Error("unexpected"));
      const { req, res } = mockReqRes();
      req.body = { customerId: "c1", items: [{ productId: "p1", quantity: 1 }] };
      await handler.Create(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("should handle AppError in todaySummary", async () => {
      svc.GetTodaySummary.mockRejectedValue(new AppError(500, "DB error"));
      const { req, res } = mockReqRes();
      await handler.TodaySummary(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("should handle 500 in todaySummary", async () => {
      svc.GetTodaySummary.mockRejectedValue(new Error("unexpected"));
      const { req, res } = mockReqRes();
      await handler.TodaySummary(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
