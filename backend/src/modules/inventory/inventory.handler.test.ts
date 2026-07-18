/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request, Response } from "express";
import { InventoryHandler } from "./handler";
import type { IInventoryService } from "./service";
import { AppError } from "../../shared/errors/AppError";

function mockReqRes() {
  const req = { body: {}, params: {}, user: undefined } as unknown as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return { req, res };
}

const mockProduct = {
  id: "prod-1",
  categoryId: "cat-1",
  sku: "GS-001",
  name: "ถังแก๊ส",
  description: null,
  unit: "piece",
  costPrice: "3500.00",
  sellPrice: "5000.00",
  minStock: 5,
  currentStock: 10,
  version: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const mockMovement = {
  id: "mov-1",
  productId: "prod-1",
  type: "IN" as const,
  quantity: 5,
  referenceType: null,
  referenceId: null,
  createdBy: "user-1",
  note: null,
  createdAt: "2026-01-02T00:00:00.000Z",
};

describe("InventoryHandler", () => {
  let svc: jest.Mocked<IInventoryService>;
  let handler: InventoryHandler;

  beforeEach(() => {
    svc = {
      filter: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      adjustStock: jest.fn(),
      listCategories: jest.fn(),
    };
    handler = new InventoryHandler(svc);
  });

  describe("filter", () => {
    it("should return 200 with data", async () => {
      svc.filter.mockResolvedValue({ data: [mockProduct], pagination: { page: 1, pageSize: 20, totalData: 1, totalPage: 1, hasNextPage: false, hasPreviousPage: false } });
      const { req, res } = mockReqRes();
      req.body = { page: 1, pageSize: 20, filters: [] };
      await handler.filter(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getById", () => {
    it("should return 200 with product", async () => {
      svc.getById.mockResolvedValue({ ...mockProduct, movements: [mockMovement] });
      const { req, res } = mockReqRes();
      req.params = { id: "prod-1" };
      await handler.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("create", () => {
    it("should return 201 on success", async () => {
      svc.create.mockResolvedValue(mockProduct);
      const { req, res } = mockReqRes();
      req.body = { categoryId: "cat-1", sku: "GS-001", name: "ถังแก๊ส" };
      await handler.create(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("update", () => {
    it("should return 200 on success", async () => {
      svc.update.mockResolvedValue({ ...mockProduct, name: "Updated", version: 2 });
      const { req, res } = mockReqRes();
      req.params = { id: "prod-1" };
      req.body = { name: "Updated", version: 1 };
      await handler.update(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("softDelete", () => {
    it("should return 200 on success", async () => {
      svc.softDelete.mockResolvedValue(undefined);
      const { req, res } = mockReqRes();
      req.params = { id: "prod-1" };
      req.body = { version: 1 };
      await handler.softDelete(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("adjustStock", () => {
    it("should return 200 with userId from req.user", async () => {
      svc.adjustStock.mockResolvedValue({ product: mockProduct, movement: mockMovement });
      const { req, res } = mockReqRes();
      req.params = { id: "prod-1" };
      req.body = { type: "IN", quantity: 5 };
      req.user = { userId: "user-1", role: "ADMIN" };
      await handler.adjustStock(req, res);
      expect(svc.adjustStock).toHaveBeenCalledWith("prod-1", expect.any(Object), "user-1");
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should use system when no req.user", async () => {
      svc.adjustStock.mockResolvedValue({ product: mockProduct, movement: mockMovement });
      const { req, res } = mockReqRes();
      req.params = { id: "prod-1" };
      req.body = { type: "IN", quantity: 5 };
      await handler.adjustStock(req, res);
      expect(svc.adjustStock).toHaveBeenCalledWith("prod-1", expect.any(Object), "system");
    });
  });

  describe("listCategories", () => {
    it("should return 200 with categories", async () => {
      svc.listCategories.mockResolvedValue([{ id: "cat-1", name: "ถังแก๊ส", description: null }]);
      const { req, res } = mockReqRes();
      await handler.listCategories(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("error cases", () => {
    it("should handle AppError with details", async () => {
      svc.getById.mockRejectedValue(new AppError(404, "Product not found", { id: "xxx" }));
      const { req, res } = mockReqRes();
      req.params = { id: "xxx" };
      await handler.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ code: 404, message: "Product not found", details: { id: "xxx" } });
    });

    it("should handle ZodError", async () => {
      const { req, res } = mockReqRes();
      req.params = { id: "prod-1" };
      req.body = { type: "INVALID" };
      await handler.adjustStock(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should handle unexpected error as 500", async () => {
      svc.filter.mockRejectedValue(new Error("unexpected"));
      const { req, res } = mockReqRes();
      req.body = { page: 1, pageSize: 20, filters: [] };
      await handler.filter(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("extractId with array params", () => {
    it("should handle id as array", async () => {
      svc.getById.mockResolvedValue({ ...mockProduct, movements: [] });
      const { req, res } = mockReqRes();
      req.params = { id: ["prod-1", "prod-2"] as any };
      await handler.getById(req, res);
      expect(svc.getById).toHaveBeenCalledWith("prod-1");
    });
  });
});
