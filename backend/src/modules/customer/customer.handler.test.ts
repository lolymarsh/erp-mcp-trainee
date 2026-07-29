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
      Filter: jest.fn(),
      GetById: jest.fn(),
      Create: jest.fn(),
      Update: jest.fn(),
      SoftDelete: jest.fn(),
      CreateVehicle: jest.fn(),
      UpdateVehicle: jest.fn(),
      DeleteVehicle: jest.fn(),
    };
    handler = new CustomerHandler(svc);
  });

  describe("filter", () => {
    it("should return 200 with data and pagination", async () => {
      svc.Filter.mockResolvedValue({ data: [mockCustomer], pagination: { page: 1, pageSize: 20, totalData: 1, totalPage: 1, hasNextPage: false, hasPreviousPage: false } });
      const { req, res } = mockReqRes();
      req.body = { page: 1, pageSize: 20, filters: [] };
      await handler.Filter(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ code: 200, message: "success", data: [mockCustomer], pagination: expect.any(Object) });
    });

    it("should return 400 on validation error", async () => {
      const { req, res } = mockReqRes();
      req.body = { page: -1 };
      await handler.Filter(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("getById", () => {
    it("should return 200 with customer", async () => {
      svc.GetById.mockResolvedValue({ ...mockCustomer, vehicles: [mockVehicle] });
      const { req, res } = mockReqRes();
      req.params = { id: "cust-1" };
      await handler.GetById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 404 when not found", async () => {
      svc.GetById.mockRejectedValue(new AppError(404, "Customer not found"));
      const { req, res } = mockReqRes();
      req.params = { id: "nonexistent" };
      await handler.GetById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("create", () => {
    it("should return 201 on success", async () => {
      svc.Create.mockResolvedValue(mockCustomer);
      const { req, res } = mockReqRes();
      req.body = { firstName: "สมชาย", lastName: "ใจดี", phone: "0812345678" };
      await handler.Create(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should return 400 on validation error", async () => {
      const { req, res } = mockReqRes();
      req.body = {};
      await handler.Create(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("update", () => {
    it("should return 200 on success", async () => {
      svc.Update.mockResolvedValue({ ...mockCustomer, firstName: "สมหมาย", version: 2 });
      const { req, res } = mockReqRes();
      req.params = { id: "cust-1" };
      req.body = { firstName: "สมหมาย", version: 1 };
      await handler.Update(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 409 on version conflict", async () => {
      svc.Update.mockRejectedValue(new AppError(409, "Version mismatch"));
      const { req, res } = mockReqRes();
      req.params = { id: "cust-1" };
      req.body = { firstName: "สมหมาย", version: 1 };
      await handler.Update(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe("softDelete", () => {
    it("should return 200 on success", async () => {
      svc.SoftDelete.mockResolvedValue(undefined);
      const { req, res } = mockReqRes();
      req.params = { id: "cust-1" };
      req.body = { version: 1 };
      await handler.SoftDelete(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ code: 200, message: "deleted" });
    });

    it("should return 404 when not found", async () => {
      svc.SoftDelete.mockRejectedValue(new AppError(404, "Customer not found"));
      const { req, res } = mockReqRes();
      req.params = { id: "nonexistent" };
      req.body = { version: 1 };
      await handler.SoftDelete(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("error cases", () => {
    it("should call SendError with details for AppError", async () => {
      svc.Filter.mockRejectedValue(new AppError(422, "Custom error", { field: "phone" }));
      const { req, res } = mockReqRes();
      req.body = { page: 1, pageSize: 20, filters: [] };
      await handler.Filter(req, res);
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({ code: 422, message: "Custom error", details: { field: "phone" } });
    });
  });
});
