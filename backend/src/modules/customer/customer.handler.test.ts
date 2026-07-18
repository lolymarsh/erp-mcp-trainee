import type { Request, Response } from "express";
import { CustomerHandler } from "./handler";
import type { ICustomerService } from "./service";
import { AppError } from "../../shared/errors/AppError";

function mockReqRes() {
  const req = { body: {}, params: {} } as unknown as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return { req, res };
}

const mockCustomer = {
  id: "cust-1",
  firstName: "สมชาย",
  lastName: "ใจดี",
  phone: "0812345678",
  email: "somchai@email.com",
  address: "123 ถนนสุขุมวิท",
  version: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const mockVehicle = {
  id: "veh-1",
  customerId: "cust-1",
  licensePlate: "กข 1234",
  brand: "Toyota",
  model: "Vios",
  year: 2020,
  engineType: "GASOLINE",
  fuelType: "GASOLINE",
};

describe("CustomerHandler", () => {
  let svc: jest.Mocked<ICustomerService>;
  let handler: CustomerHandler;

  beforeEach(() => {
    svc = {
      filter: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };
    handler = new CustomerHandler(svc);
  });

  describe("filter", () => {
    it("should return 200 with data and pagination", async () => {
      svc.filter.mockResolvedValue({ data: [mockCustomer], pagination: { page: 1, pageSize: 20, totalData: 1, totalPage: 1, hasNextPage: false, hasPreviousPage: false } });
      const { req, res } = mockReqRes();
      req.body = { page: 1, pageSize: 20, filters: [] };
      await handler.filter(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ code: 200, message: "success", data: [mockCustomer], pagination: expect.any(Object) });
    });

    it("should return 400 on validation error", async () => {
      const { req, res } = mockReqRes();
      req.body = { page: -1 };
      await handler.filter(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("getById", () => {
    it("should return 200 with customer", async () => {
      svc.getById.mockResolvedValue({ ...mockCustomer, vehicles: [mockVehicle] });
      const { req, res } = mockReqRes();
      req.params = { id: "cust-1" };
      await handler.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 404 when not found", async () => {
      svc.getById.mockRejectedValue(new AppError(404, "Customer not found"));
      const { req, res } = mockReqRes();
      req.params = { id: "nonexistent" };
      await handler.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("create", () => {
    it("should return 201 on success", async () => {
      svc.create.mockResolvedValue(mockCustomer);
      const { req, res } = mockReqRes();
      req.body = { firstName: "สมชาย", lastName: "ใจดี", phone: "0812345678" };
      await handler.create(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should return 400 on validation error", async () => {
      const { req, res } = mockReqRes();
      req.body = {};
      await handler.create(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("update", () => {
    it("should return 200 on success", async () => {
      svc.update.mockResolvedValue({ ...mockCustomer, firstName: "สมหมาย", version: 2 });
      const { req, res } = mockReqRes();
      req.params = { id: "cust-1" };
      req.body = { firstName: "สมหมาย", version: 1 };
      await handler.update(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 409 on version conflict", async () => {
      svc.update.mockRejectedValue(new AppError(409, "Version mismatch"));
      const { req, res } = mockReqRes();
      req.params = { id: "cust-1" };
      req.body = { firstName: "สมหมาย", version: 1 };
      await handler.update(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe("softDelete", () => {
    it("should return 200 on success", async () => {
      svc.softDelete.mockResolvedValue(undefined);
      const { req, res } = mockReqRes();
      req.params = { id: "cust-1" };
      req.body = { version: 1 };
      await handler.softDelete(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ code: 200, message: "deleted" });
    });

    it("should return 404 when not found", async () => {
      svc.softDelete.mockRejectedValue(new AppError(404, "Customer not found"));
      const { req, res } = mockReqRes();
      req.params = { id: "nonexistent" };
      req.body = { version: 1 };
      await handler.softDelete(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("error cases", () => {
    it("should call sendError with details for AppError", async () => {
      svc.filter.mockRejectedValue(new AppError(422, "Custom error", { field: "phone" }));
      const { req, res } = mockReqRes();
      req.body = { page: 1, pageSize: 20, filters: [] };
      await handler.filter(req, res);
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({ code: 422, message: "Custom error", details: { field: "phone" } });
    });
  });
});
