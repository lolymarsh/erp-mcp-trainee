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
import type { MySql2Database } from "drizzle-orm/mysql2";
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
  let db: Partial<MySql2Database>;
  let redis: jest.Mocked<Redis>;
  let svc: InvoiceService;

  beforeEach(() => {
    repo = {
      findFiltered: jest.fn(),
      findById: jest.fn(),
      findByIdWithItems: jest.fn(),
      createInvoice: jest.fn(),
      getTodaySummary: jest.fn(),
    };
    db = {
      select: jest.fn(),
    };
    redis = { del: jest.fn() } as unknown as jest.Mocked<Redis>;
    svc = new InvoiceService(repo, db as MySql2Database, redis);
  });

  describe("filter", () => {
    it("should return paginated invoices", async () => {
      repo.findFiltered.mockResolvedValue({
        data: [mockInvoice],
        total: 1,
      });

      const result = await svc.filter({
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
      repo.findFiltered.mockResolvedValue({ data: [], total: 0 });

      const result = await svc.filter({
        page: 1,
        pageSize: 20,
        sortBy: "desc",
        filters: [],
      });

      expect(result.data).toHaveLength(0);
      expect(result.pagination.hasNextPage).toBe(false);
    });

    it("should calculate multi-page pagination", async () => {
      repo.findFiltered.mockResolvedValue({ data: [], total: 45 });

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
    it("should throw NotFoundError when invoice not found", async () => {
      repo.findByIdWithItems.mockResolvedValue(null);

      await expect(svc.getById("nonexistent")).rejects.toThrow(NotFoundError);
    });

    it("should return invoice with items", async () => {
      repo.findByIdWithItems.mockResolvedValue({
        invoice: mockInvoice,
        items: [mockItem],
      });

      const result = await svc.getById("inv-1");

      expect(result.invoiceNumber).toBe("INV-20260101-001");
      expect(result.items).toHaveLength(1);
      expect(result.items[0].productId).toBe("prod-1");
    });

    it("should return invoice with empty items", async () => {
      repo.findByIdWithItems.mockResolvedValue({
        invoice: mockInvoice,
        items: [],
      });

      const result = await svc.getById("inv-1");

      expect(result.items).toHaveLength(0);
    });
  });

  describe("getTodaySummary", () => {
    it("should return today summary", async () => {
      repo.getTodaySummary.mockResolvedValue({
        totalAmount: "15000.00",
        count: 3,
      });

      const result = await svc.getTodaySummary();

      expect(result.totalAmount).toBe("15000.00");
      expect(result.count).toBe(3);
    });

    it("should return zero when no invoices today", async () => {
      repo.getTodaySummary.mockResolvedValue({
        totalAmount: "0.00",
        count: 0,
      });

      const result = await svc.getTodaySummary();

      expect(result.count).toBe(0);
      expect(result.totalAmount).toBe("0.00");
    });
  });

  describe("create", () => {
    const mockCreateResult = {
      invoice: { ...mockInvoice, id: "inv-new" },
      items: [mockItem],
    };

    function buildDbMock(customerResult: Record<string, unknown>[], productsResult: Record<string, unknown>[]) {
      let callCount = 0;
      return {
        select: jest.fn().mockReturnThis(),
        from: jest.fn((_table: Record<string, unknown>) => {
          callCount += 1;
          if (callCount === 1) {
            return {
              where: jest.fn().mockReturnThis(),
              limit: jest.fn().mockResolvedValue(customerResult),
            };
          }
          return {
            where: jest.fn().mockResolvedValue(productsResult),
          };
        }),
      };
    }

    it("should create invoice successfully", async () => {
      const mockDb = buildDbMock(
        [{ id: "cust-1", firstName: "สมชาย" }],
        [{ id: "prod-1", name: "สินค้า", sku: "SKU-1", sellPrice: "5000.00", currentStock: 10, deletedAt: null }],
      );
      Object.assign(db, mockDb);
      repo.createInvoice.mockResolvedValue(mockCreateResult);

      const result = await svc.create(
        { customerId: "cust-1", items: [{ productId: "prod-1", quantity: 1 }], discount: 0 },
        "user-1",
      );

      expect(result.invoiceNumber).toBe("INV-20260101-001");
      expect(result.items).toHaveLength(1);
      expect(redis.del).toHaveBeenCalled();
    });

    it("should throw BadRequestError when customer not found", async () => {
      const mockDb = buildDbMock([], [{ id: "prod-1", sellPrice: "5000.00", currentStock: 10 }]);
      Object.assign(db, mockDb);

      await expect(svc.create(
        { customerId: "nonexistent", items: [{ productId: "prod-1", quantity: 1 }], discount: 0 },
        "user-1",
      )).rejects.toThrow(BadRequestError);
    });

    it("should throw BadRequestError when product not found", async () => {
      const mockDb = buildDbMock(
        [{ id: "cust-1" }],
        [{ id: "prod-2", name: "Other", sku: "SKU-2", sellPrice: "3000.00", currentStock: 5, deletedAt: null }],
      );
      Object.assign(db, mockDb);

      await expect(svc.create(
        { customerId: "cust-1", items: [{ productId: "prod-unknown", quantity: 1 }], discount: 0 },
        "user-1",
      )).rejects.toThrow(BadRequestError);
    });

    it("should throw BadRequestError when insufficient stock", async () => {
      const mockDb = buildDbMock(
        [{ id: "cust-1" }],
        [{ id: "prod-1", name: "สินค้า", sku: "SKU-1", sellPrice: "5000.00", currentStock: 0, deletedAt: null }],
      );
      Object.assign(db, mockDb);

      await expect(svc.create(
        { customerId: "cust-1", items: [{ productId: "prod-1", quantity: 1 }], discount: 0 },
        "user-1",
      )).rejects.toThrow(BadRequestError);
    });
  });
});
