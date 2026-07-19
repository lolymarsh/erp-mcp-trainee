jest.mock("uuid", () => ({ v4: () => "mocked-uuid-customer" }));

import { CustomerService } from "./service";
import type { ICustomerRepository } from "./repo";
import { NotFoundError, ConflictError } from "../../shared/errors/AppError";

const mockCustomer = {
  id: "cust-1",
  firstName: "สมชาย",
  lastName: "ใจดี",
  phone: "0812345678",
  email: "somchai@email.com",
  address: "123 ถนนสุขุมวิท กรุงเทพฯ",
  version: 1,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  deletedAt: null,
};

const mockVehicle = {
  id: "veh-1",
  customerId: "cust-1",
  licensePlate: "กข 1234",
  brand: "Toyota",
  model: "Vios",
  year: 2020,
  engineType: "GASOLINE" as const,
  fuelType: "GASOLINE" as const,
};

describe("CustomerService", () => {
  let repo: jest.Mocked<ICustomerRepository>;
  let svc: CustomerService;
  const mockAuditService = { insertAuditLog: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    repo = {
      findFiltered: jest.fn(),
      findById: jest.fn(),
      findByIdWithVehicles: jest.fn(),
      findByPhone: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      findVehicleById: jest.fn(),
    };
    svc = new CustomerService(repo, mockAuditService as any);
  });

  describe("filter", () => {
    it("should return paginated customers", async () => {
      repo.findFiltered.mockResolvedValue({
        data: [mockCustomer],
        total: 1,
      });

      const result = await svc.filter({
        page: 1,
        pageSize: 20,
        sortBy: "desc",
        filters: [],
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].firstName).toBe("สมชาย");
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalData).toBe(1);
    });

    it("should return empty list when no customers", async () => {
      repo.findFiltered.mockResolvedValue({ data: [], total: 0 });

      const result = await svc.filter({
        page: 1,
        pageSize: 20,
        sortBy: "desc",
        filters: [],
      });

      expect(result.data).toHaveLength(0);
      expect(result.pagination.totalData).toBe(0);
      expect(result.pagination.hasNextPage).toBe(false);
    });

    it("should calculate multi-page pagination", async () => {
      repo.findFiltered.mockResolvedValue({ data: [], total: 55 });

      const result = await svc.filter({
        page: 2,
        pageSize: 20,
        sortBy: "asc",
        filters: [],
      });

      expect(result.pagination.totalPage).toBe(3);
      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.pagination.hasPreviousPage).toBe(true);
    });
  });

  describe("getById", () => {
    it("should throw NotFoundError when customer not found", async () => {
      repo.findByIdWithVehicles.mockResolvedValue(null);

      await expect(svc.getById("nonexistent")).rejects.toThrow(NotFoundError);
    });

    it("should return customer with vehicles", async () => {
      repo.findByIdWithVehicles.mockResolvedValue({
        customer: mockCustomer,
        vehicles: [mockVehicle],
      });

      const result = await svc.getById("cust-1");

      expect(result.id).toBe("cust-1");
      expect(result.firstName).toBe("สมชาย");
      expect(result.vehicles).toHaveLength(1);
      expect(result.vehicles[0].licensePlate).toBe("กข 1234");
    });

    it("should return customer with empty vehicles array", async () => {
      repo.findByIdWithVehicles.mockResolvedValue({
        customer: mockCustomer,
        vehicles: [],
      });

      const result = await svc.getById("cust-1");

      expect(result.vehicles).toHaveLength(0);
    });
  });

  describe("create", () => {
    it("should throw when phone already exists", async () => {
      repo.findByPhone.mockResolvedValue(mockCustomer);

      await expect(
        svc.create({
          firstName: "สมชาย",
          lastName: "ใจดี",
          phone: "0812345678",
          email: "somchai@email.com",
          address: "123 ถนนสุขุมวิท",
        }, "user-1"),
      ).rejects.toThrow("Phone number already exists");
    });

    it("should create customer with generated id", async () => {
      repo.findByPhone.mockResolvedValue(null);
      repo.create.mockResolvedValue(mockCustomer);

      const result = await svc.create({
        firstName: "สมชาย",
        lastName: "ใจดี",
        phone: "0812345678",
        email: null,
        address: null,
      }, "user-1");

      expect(result.firstName).toBe("สมชาย");
      expect(result.version).toBe(1);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "mocked-uuid-customer",
          firstName: "สมชาย",
          version: 1,
        }),
      );
    });

    it("should create customer with optional fields null", async () => {
      repo.findByPhone.mockResolvedValue(null);
      repo.create.mockResolvedValue({
        ...mockCustomer,
        email: null,
        address: null,
      });

      const result = await svc.create({
        firstName: "สมชาย",
        lastName: "ใจดี",
        phone: "0812345678",
      }, "user-1");

      expect(result.email).toBeNull();
      expect(result.address).toBeNull();
    });
  });

  describe("update", () => {
    it("should throw ConflictError on version mismatch", async () => {
      repo.findById.mockResolvedValue(mockCustomer);
      repo.findByPhone.mockResolvedValue(null);
      repo.update.mockResolvedValue(null);

      await expect(
        svc.update("cust-1", {
          firstName: "สมหมาย",
          version: 1,
        }, "user-1"),
      ).rejects.toThrow(ConflictError);
    });

    it("should throw when updated phone conflicts", async () => {
      repo.findById.mockResolvedValue(mockCustomer);
      repo.findByPhone.mockResolvedValue({ ...mockCustomer, id: "cust-2" });

      await expect(
        svc.update("cust-1", {
          phone: "0812345678",
          version: 1,
        }, "user-1"),
      ).rejects.toThrow("Phone number already exists");
    });

    it("should update customer successfully", async () => {
      repo.findById.mockResolvedValue(mockCustomer);
      repo.findByPhone.mockResolvedValue(null);
      const updatedCustomer = {
        ...mockCustomer,
        firstName: "สมหมาย",
        version: 2,
      };
      repo.update.mockResolvedValue(updatedCustomer);

      const result = await svc.update("cust-1", {
        firstName: "สมหมาย",
        version: 1,
      }, "user-1");

      expect(result.firstName).toBe("สมหมาย");
      expect(repo.update).toHaveBeenCalledWith(
        "cust-1",
        { firstName: "สมหมาย" },
        1,
      );
    });

    it("should allow updating with same phone", async () => {
      repo.findById.mockResolvedValue(mockCustomer);
      repo.findByPhone.mockResolvedValue(mockCustomer);
      repo.update.mockResolvedValue({
        ...mockCustomer,
        phone: "0812345678",
        version: 2,
      });

      const result = await svc.update("cust-1", {
        phone: "0812345678",
        version: 1,
      }, "user-1");

      expect(result.phone).toBe("0812345678");
      expect(repo.update).toHaveBeenCalled();
    });
  });

  describe("softDelete", () => {
    it("should throw ConflictError on version mismatch", async () => {
      repo.findById.mockResolvedValue(mockCustomer);
      repo.softDelete.mockResolvedValue(false);

      await expect(svc.softDelete("cust-1", { version: 1 }, "user-1")).rejects.toThrow(
        ConflictError,
      );
    });

    it("should soft delete customer successfully", async () => {
      repo.findById.mockResolvedValue(mockCustomer);
      repo.softDelete.mockResolvedValue(true);
      repo.findById.mockResolvedValue({ ...mockCustomer, deletedAt: new Date() });

      await expect(
        svc.softDelete("cust-1", { version: 1 }, "user-1"),
      ).resolves.toBeUndefined();

      expect(repo.softDelete).toHaveBeenCalledWith("cust-1", 1);
    });
  });
});
