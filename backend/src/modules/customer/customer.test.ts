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
  const mockAuditService = { Insert: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    repo = {
      FindFiltered: jest.fn(),
      FindById: jest.fn(),
      FindByIdWithVehicles: jest.fn(),
      FindByPhone: jest.fn(),
      Create: jest.fn(),
      Update: jest.fn(),
      SoftDelete: jest.fn(),
      FindVehicleById: jest.fn(),
      CreateVehicle: jest.fn(),
      UpdateVehicle: jest.fn(),
      DeleteVehicle: jest.fn(),
    };
    svc = new CustomerService(repo, mockAuditService as any);
  });

  describe("filter", () => {
    it("should return paginated customers", async () => {
      repo.FindFiltered.mockResolvedValue({
        data: [mockCustomer],
        total: 1,
      });

      const result = await svc.Filter({
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
      repo.FindFiltered.mockResolvedValue({ data: [], total: 0 });

      const result = await svc.Filter({
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
      repo.FindFiltered.mockResolvedValue({ data: [], total: 55 });

      const result = await svc.Filter({
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
      repo.FindByIdWithVehicles.mockResolvedValue(null);

      await expect(svc.GetById("nonexistent")).rejects.toThrow(NotFoundError);
    });

    it("should return customer with vehicles", async () => {
      repo.FindByIdWithVehicles.mockResolvedValue({
        customer: mockCustomer,
        vehicles: [mockVehicle],
      });

      const result = await svc.GetById("cust-1");

      expect(result.id).toBe("cust-1");
      expect(result.firstName).toBe("สมชาย");
      expect(result.vehicles).toHaveLength(1);
      expect(result.vehicles[0].licensePlate).toBe("กข 1234");
    });

    it("should return customer with empty vehicles array", async () => {
      repo.FindByIdWithVehicles.mockResolvedValue({
        customer: mockCustomer,
        vehicles: [],
      });

      const result = await svc.GetById("cust-1");

      expect(result.vehicles).toHaveLength(0);
    });
  });

  describe("create", () => {
    it("should throw when phone already exists", async () => {
      repo.FindByPhone.mockResolvedValue(mockCustomer);

      await expect(
        svc.Create({
          firstName: "สมชาย",
          lastName: "ใจดี",
          phone: "0812345678",
          email: "somchai@email.com",
          address: "123 ถนนสุขุมวิท",
        }, "user-1"),
      ).rejects.toThrow("Phone number already exists");
    });

    it("should create customer with generated id", async () => {
      repo.FindByPhone.mockResolvedValue(null);
      repo.Create.mockResolvedValue(mockCustomer);
      const result = await svc.Create({
        firstName: "สมชาย",
        lastName: "ใจดี",
        phone: "0812345678",
        email: null,
        address: null,
      }, "user-1");

      expect(result.firstName).toBe("สมชาย");
      expect(result.version).toBe(1);
      expect(repo.Create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "mocked-uuid-customer",
          firstName: "สมชาย",
          version: 1,
        }),
      );
    });

    it("should create customer with optional fields null", async () => {
      repo.FindByPhone.mockResolvedValue(null);
      repo.Create.mockResolvedValue({
        ...mockCustomer,
        email: null,
        address: null,
      });

      const result = await svc.Create({
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
      repo.FindById.mockResolvedValue(mockCustomer);
      repo.FindByPhone.mockResolvedValue(null);
      repo.Update.mockResolvedValue(null);

      await expect(
        svc.Update("cust-1", {
          firstName: "สมหมาย",
          version: 1,
        }, "user-1"),
      ).rejects.toThrow(ConflictError);
    });

    it("should throw when updated phone conflicts", async () => {
      repo.FindById.mockResolvedValue(mockCustomer);
      repo.FindByPhone.mockResolvedValue({ ...mockCustomer, id: "cust-2" });

      await expect(
        svc.Update("cust-1", {
          phone: "0812345678",
          version: 1,
        }, "user-1"),
      ).rejects.toThrow("Phone number already exists");
    });

    it("should update customer successfully", async () => {
      repo.FindById.mockResolvedValue(mockCustomer);
      repo.FindByPhone.mockResolvedValue(null);
      const updatedCustomer = {
        ...mockCustomer,
        firstName: "สมหมาย",
        version: 2,
      };
      repo.Update.mockResolvedValue(updatedCustomer);

      const result = await svc.Update("cust-1", {
        firstName: "สมหมาย",
        version: 1,
      }, "user-1");

      expect(result.firstName).toBe("สมหมาย");
      expect(repo.Update).toHaveBeenCalledWith(
        "cust-1",
        { firstName: "สมหมาย" },
        1,
      );
    });

    it("should allow updating with same phone", async () => {
      repo.FindById.mockResolvedValue(mockCustomer);
      repo.FindByPhone.mockResolvedValue(mockCustomer);
      repo.Update.mockResolvedValue({
        ...mockCustomer,
        phone: "0812345678",
        version: 2,
      });

      const result = await svc.Update("cust-1", {
        phone: "0812345678",
        version: 1,
      }, "user-1");

      expect(result.phone).toBe("0812345678");
      expect(repo.Update).toHaveBeenCalled();
    });
  });

  describe("softDelete", () => {
    it("should throw ConflictError on version mismatch", async () => {
      repo.FindById.mockResolvedValue(mockCustomer);
      repo.SoftDelete.mockResolvedValue(false);

      await expect(svc.SoftDelete("cust-1", { version: 1 }, "user-1")).rejects.toThrow(
        ConflictError,
      );
    });

    it("should soft delete customer successfully", async () => {
      repo.FindById.mockResolvedValue(mockCustomer);
      repo.SoftDelete.mockResolvedValue(true);
      repo.FindById.mockResolvedValue({ ...mockCustomer, deletedAt: new Date() });

      await expect(
        svc.SoftDelete("cust-1", { version: 1 }, "user-1"),
      ).resolves.toBeUndefined();

      expect(repo.SoftDelete).toHaveBeenCalledWith("cust-1", 1);
    });
  });

  describe("createVehicle", () => {
    it("should throw NotFoundError when customer not found", async () => {
      repo.FindById.mockResolvedValue(null);

      await expect(
        svc.CreateVehicle(
          { customerId: "nonexistent", licensePlate: "กข 1234" },
          "user-1",
        ),
      ).rejects.toThrow(NotFoundError);
    });

    it("should create vehicle for existing customer", async () => {
      repo.FindById.mockResolvedValue(mockCustomer);
      repo.CreateVehicle.mockResolvedValue(mockVehicle);

      const result = await svc.CreateVehicle(
        {
          customerId: "cust-1",
          licensePlate: "กข 1234",
          brand: "Toyota",
          model: "Vios",
          year: 2020,
          engineType: "GASOLINE",
          fuelType: "GASOLINE",
        },
        "user-1",
      );

      expect(result.licensePlate).toBe("กข 1234");
      expect(repo.CreateVehicle).toHaveBeenCalledWith(
        expect.objectContaining({ customerId: "cust-1", licensePlate: "กข 1234" }),
      );
    });

    it("should create vehicle with null optional fields", async () => {
      repo.FindById.mockResolvedValue(mockCustomer);
      repo.CreateVehicle.mockResolvedValue({
        ...mockVehicle,
        brand: null,
        model: null,
        year: null,
        engineType: null,
        fuelType: null,
      });

      const result = await svc.CreateVehicle(
        { customerId: "cust-1", licensePlate: "กข 1234" },
        "user-1",
      );

      expect(result.brand).toBeNull();
      expect(result.model).toBeNull();
    });
  });

  describe("updateVehicle", () => {
    it("should throw NotFoundError when vehicle not found", async () => {
      repo.FindVehicleById.mockResolvedValue(null);

      await expect(
        svc.UpdateVehicle("nonexistent", { licensePlate: " updated" }, "user-1"),
      ).rejects.toThrow(NotFoundError);
    });

    it("should update vehicle successfully", async () => {
      repo.FindVehicleById.mockResolvedValue(mockVehicle);
      const updatedVehicle = { ...mockVehicle, licensePlate: "กข 5678" };
      repo.UpdateVehicle.mockResolvedValue(updatedVehicle);

      const result = await svc.UpdateVehicle(
        "veh-1",
        { licensePlate: "กข 5678" },
        "user-1",
      );

      expect(result.licensePlate).toBe("กข 5678");
      expect(repo.UpdateVehicle).toHaveBeenCalledWith("veh-1", {
        licensePlate: "กข 5678",
      });
    });

    it("should throw NotFoundError when update returns null", async () => {
      repo.FindVehicleById.mockResolvedValue(mockVehicle);
      repo.UpdateVehicle.mockResolvedValue(null);

      await expect(
        svc.UpdateVehicle("veh-1", { licensePlate: "กข 5678" }, "user-1"),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("deleteVehicle", () => {
    it("should throw NotFoundError when vehicle not found", async () => {
      repo.FindVehicleById.mockResolvedValue(null);

      await expect(
        svc.DeleteVehicle("nonexistent", {}, "user-1"),
      ).rejects.toThrow(NotFoundError);
    });

    it("should delete vehicle successfully", async () => {
      repo.FindVehicleById.mockResolvedValue(mockVehicle);
      repo.DeleteVehicle.mockResolvedValue(true);

      await expect(
        svc.DeleteVehicle("veh-1", {}, "user-1"),
      ).resolves.toBeUndefined();

      expect(repo.DeleteVehicle).toHaveBeenCalledWith("veh-1");
    });
  });
});
