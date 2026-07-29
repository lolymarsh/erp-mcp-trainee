jest.mock("uuid", () => {
  let counter = 0;
  return {
    v4: jest.fn(() => {
      counter += 1;
      return `mocked-uuid-inv-${counter}`;
    }),
  };
});

import Redis from "ioredis";
import { InvoiceService } from "./service";
import type { IInvoiceRepository } from "./repo";
import type { ICustomerRepository } from "../customer/repo";
import type { IInventoryRepository } from "../inventory/repo";
import { NotFoundError, BadRequestError } from "../../shared/errors/AppError";

const mockInvoice = {
  id: "inv-1",
  invoiceNumber: "INV-20260101-001",
  customerId: "cust-1",
  vehicleId: null,
  totalAmount: "5000.00",
  discount: "0.00",
  tax: "0.00",
  grandTotal: "5000.00",
  paymentStatus: "PENDING" as const,
  paymentMethod: null,
  version: 1,
  createdBy: "user-1",
  createdAt: new Date("2026-07-18"),
  updatedAt: new Date("2026-07-18"),
};

const mockItem = {
  id: "item-1",
  invoiceId: "inv-1",
  productId: "prod-1",
  quantity: 1,
  unitPrice: "5000.00",
  total: "5000.00",
};

describe("InvoiceService", () => {
  let repo: jest.Mocked<IInvoiceRepository>;
  let customerRepo: jest.Mocked<ICustomerRepository>;
  let inventoryRepo: jest.Mocked<IInventoryRepository>;
  let redis: jest.Mocked<Redis>;
  let svc: InvoiceService;
  const mockAuditService = { Insert: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    repo = {
      FindFiltered: jest.fn(),
      FindById: jest.fn(),
      FindByIdWithItems: jest.fn(),
      CreateInvoice: jest.fn(),
      GetTodaySummary: jest.fn(),
      UpdatePaymentStatus: jest.fn(),
    };
    customerRepo = {
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
    inventoryRepo = {
      FindFiltered: jest.fn(),
      FindById: jest.fn(),
      FindByIds: jest.fn(),
      FindByIdWithMovements: jest.fn(),
      FindBySku: jest.fn(),
      FindAllCategories: jest.fn(),
      FindCategoriesFiltered: jest.fn(),
      FindCategoryById: jest.fn(),
      CreateCategory: jest.fn(),
      UpdateCategory: jest.fn(),
      DeleteCategory: jest.fn(),
      Create: jest.fn(),
      Update: jest.fn(),
      SoftDelete: jest.fn(),
      AdjustStock: jest.fn(),
    };
    redis = { del: jest.fn() } as unknown as jest.Mocked<Redis>;
    svc = new InvoiceService(repo, customerRepo, inventoryRepo, redis, mockAuditService as any);
  });

  describe("filter", () => {
    it("should return paginated invoices", async () => {
      repo.FindFiltered.mockResolvedValue({
        data: [mockInvoice],
        total: 1,
      });

      const result = await svc.Filter({
        page: 1,
        pageSize: 20,
        sortBy: "desc",
        filters: [],
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].invoiceNumber).toBe("INV-20260101-001");
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalData).toBe(1);
    });

    it("should return empty list when no invoices", async () => {
      repo.FindFiltered.mockResolvedValue({ data: [], total: 0 });

      const result = await svc.Filter({
        page: 1,
        pageSize: 20,
        sortBy: "desc",
        filters: [],
      });

      expect(result.data).toHaveLength(0);
      expect(result.pagination.hasNextPage).toBe(false);
    });

    it("should calculate multi-page pagination", async () => {
      repo.FindFiltered.mockResolvedValue({ data: [], total: 45 });

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
    it("should throw NotFoundError when invoice not found", async () => {
      repo.FindByIdWithItems.mockResolvedValue(null);

      await expect(svc.GetById("nonexistent")).rejects.toThrow(NotFoundError);
    });

    it("should return invoice with items", async () => {
      repo.FindByIdWithItems.mockResolvedValue({
        invoice: mockInvoice,
        items: [mockItem],
      });

      const result = await svc.GetById("inv-1");

      expect(result.invoiceNumber).toBe("INV-20260101-001");
      expect(result.items).toHaveLength(1);
      expect(result.items[0].productId).toBe("prod-1");
    });

    it("should return invoice with empty items", async () => {
      repo.FindByIdWithItems.mockResolvedValue({
        invoice: mockInvoice,
        items: [],
      });

      const result = await svc.GetById("inv-1");

      expect(result.items).toHaveLength(0);
    });
  });

  describe("getTodaySummary", () => {
    it("should return today summary", async () => {
      repo.GetTodaySummary.mockResolvedValue({
        totalAmount: "15000.00",
        count: 3,
      });

      const result = await svc.GetTodaySummary();

      expect(result.totalAmount).toBe("15000.00");
      expect(result.count).toBe(3);
    });

    it("should return zero when no invoices today", async () => {
      repo.GetTodaySummary.mockResolvedValue({
        totalAmount: "0.00",
        count: 0,
      });

      const result = await svc.GetTodaySummary();

      expect(result.count).toBe(0);
      expect(result.totalAmount).toBe("0.00");
    });
  });

  describe("create", () => {
    const mockCreateResult = {
      invoice: { ...mockInvoice, id: "inv-new" },
      items: [mockItem],
    };

    it("should create invoice successfully", async () => {
      customerRepo.FindById.mockResolvedValue({ id: "cust-1", firstName: "สมชาย", lastName: "ใจดี", phone: "0812345678", email: null, address: null, version: 1, createdAt: new Date(), updatedAt: new Date(), deletedAt: null });
      inventoryRepo.FindByIds.mockResolvedValue([{ id: "prod-1", categoryId: "cat-1", sku: "SKU-1", name: "สินค้า", description: null, unit: "ชิ้น", costPrice: "3000.00", sellPrice: "5000.00", minStock: 1, currentStock: 10, version: 1, createdAt: new Date(), updatedAt: new Date(), deletedAt: null }]);
      repo.CreateInvoice.mockResolvedValue(mockCreateResult);

      const result = await svc.Create(
        { customerId: "cust-1", items: [{ productId: "prod-1", quantity: 1 }], discount: 0 },
        "user-1",
      );

      expect(result.invoiceNumber).toBe("INV-20260101-001");
      expect(result.items).toHaveLength(1);
      expect(redis.del).toHaveBeenCalled();
    });

    it("should throw BadRequestError when customer not found", async () => {
      customerRepo.FindById.mockResolvedValue(null);

      await expect(svc.Create(
        { customerId: "nonexistent", items: [{ productId: "prod-1", quantity: 1 }], discount: 0 },
        "user-1",
      )).rejects.toThrow(BadRequestError);
    });

    it("should throw BadRequestError when product not found", async () => {
      customerRepo.FindById.mockResolvedValue({ id: "cust-1", firstName: "สมชาย", lastName: "ใจดี", phone: "0812345678", email: null, address: null, version: 1, createdAt: new Date(), updatedAt: new Date(), deletedAt: null });
      inventoryRepo.FindByIds.mockResolvedValue([{ id: "prod-2", categoryId: "cat-1", sku: "SKU-2", name: "Other", description: null, unit: "ชิ้น", costPrice: "1000.00", sellPrice: "3000.00", minStock: 1, currentStock: 5, version: 1, createdAt: new Date(), updatedAt: new Date(), deletedAt: null }]);

      await expect(svc.Create(
        { customerId: "cust-1", items: [{ productId: "prod-unknown", quantity: 1 }], discount: 0 },
        "user-1",
      )).rejects.toThrow(BadRequestError);
    });

    it("should throw BadRequestError when insufficient stock", async () => {
      customerRepo.FindById.mockResolvedValue({ id: "cust-1", firstName: "สมชาย", lastName: "ใจดี", phone: "0812345678", email: null, address: null, version: 1, createdAt: new Date(), updatedAt: new Date(), deletedAt: null });
      inventoryRepo.FindByIds.mockResolvedValue([{ id: "prod-1", categoryId: "cat-1", sku: "SKU-1", name: "สินค้า", description: null, unit: "ชิ้น", costPrice: "3000.00", sellPrice: "5000.00", minStock: 1, currentStock: 0, version: 1, createdAt: new Date(), updatedAt: new Date(), deletedAt: null }]);

      await expect(svc.Create(
        { customerId: "cust-1", items: [{ productId: "prod-1", quantity: 1 }], discount: 0 },
        "user-1",
      )).rejects.toThrow(BadRequestError);
    });
  });
});
