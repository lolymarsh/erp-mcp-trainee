/* eslint-disable @typescript-eslint/no-explicit-any */
jest.mock("uuid", () => {
  let counter = 0;
  return { v4: jest.fn(() => { counter += 1; return `mocked-uuid-${counter}`; }) };
});

import { InvoiceRepository } from "./repo";
import type { CreateInvoiceData } from "./repo";

function createMockDb() {
  return {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    transaction: jest.fn(),
    for: jest.fn().mockReturnThis(),
  } as any;
}

const mockInvoiceEntity = {
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
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

const mockItemEntity = {
  id: "item-1",
  invoiceId: "inv-1",
  productId: "prod-1",
  quantity: 1,
  unitPrice: "5000.00",
  total: "5000.00",
};

function createMockTx() {
  return {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    for: jest.fn().mockReturnThis(),
  } as any;
}

describe("InvoiceRepository", () => {
  let db: ReturnType<typeof createMockDb>;
  let repo: InvoiceRepository;

  beforeEach(() => {
    db = createMockDb();
    repo = new InvoiceRepository(db);
  });

  describe("findFiltered", () => {
    it("should return filtered data with total", async () => {
      const mockCountResult = [{ count: 1 }];
      const countSelect = { select: jest.fn().mockReturnThis(), from: jest.fn().mockReturnThis(), where: jest.fn().mockResolvedValue(mockCountResult) };
      db.select = jest.fn().mockImplementation((fields?: any) => {
        if (fields?.count) return countSelect;
        return { from: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), orderBy: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), offset: jest.fn().mockResolvedValue([mockInvoiceEntity]) };
      });

      const result = await repo.findFiltered({ page: 1, pageSize: 20, sortBy: "desc", filters: [{ field: "paymentStatus", operator: "eq", value: "PENDING" }] });
      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
    });

    it("should return empty when no filters", async () => {
      const mockCountResult = [{ count: 0 }];
      const countSelect = { select: jest.fn().mockReturnThis(), from: jest.fn().mockReturnThis(), where: jest.fn().mockResolvedValue(mockCountResult) };
      db.select = jest.fn().mockImplementation((fields?: any) => {
        if (fields?.count) return countSelect;
        return { from: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), orderBy: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), offset: jest.fn().mockResolvedValue([]) };
      });

      const result = await repo.findFiltered({ page: 1, pageSize: 20, sortBy: "desc", filters: [] });
      expect(result.total).toBe(0);
      expect(result.data).toHaveLength(0);
    });
  });

  describe("findById", () => {
    it("should return invoice when found", async () => {
      const mockWhere = jest.fn().mockReturnThis();
      db.where = mockWhere;
      db.limit = jest.fn().mockResolvedValue([mockInvoiceEntity]);
      const result = await repo.findById("inv-1");
      expect(result).toEqual(mockInvoiceEntity);
    });

    it("should return null when not found", async () => {
      db.where = jest.fn().mockReturnThis();
      db.limit = jest.fn().mockResolvedValue([]);
      const result = await repo.findById("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("createInvoice", () => {
    it("should execute transaction successfully with stock deduction", async () => {
      const mockTx = createMockTx();
      mockTx.select = jest.fn().mockReturnThis();
      mockTx.from = jest.fn().mockReturnThis();
      mockTx.where = jest.fn().mockReturnThis();
      mockTx.for = jest.fn().mockReturnThis();
      mockTx.limit = jest.fn().mockResolvedValue([{ id: "prod-1", currentStock: 10, sellPrice: "5000.00" }]);
      mockTx.insert = jest.fn().mockReturnThis();
      mockTx.values = jest.fn().mockResolvedValue(undefined);
      mockTx.update = jest.fn().mockReturnThis();
      mockTx.set = jest.fn().mockReturnThis();

      db.transaction.mockImplementation(async (cb: (tx: any) => Promise<any>) => cb(mockTx));

      const input: CreateInvoiceData = {
        invoiceNumber: "INV-20260101-001",
        customerId: "cust-1",
        vehicleId: null,
        discount: "0",
        tax: "0",
        totalAmount: "5000.00",
        grandTotal: "5000.00",
        paymentMethod: null,
        createdBy: "user-1",
        items: [{ productId: "prod-1", quantity: 1, unitPrice: "5000.00", total: "5000.00" }],
      };

      const result = await repo.createInvoice(input);
      expect(result.invoice.invoiceNumber).toBe("INV-20260101-001");
      expect(result.items).toHaveLength(1);
      expect(mockTx.insert).toHaveBeenCalled();
      expect(mockTx.update).toHaveBeenCalled();
    });

    it("should throw when product not found in transaction", async () => {
      const mockTx = createMockTx();
      mockTx.select = jest.fn().mockReturnThis();
      mockTx.from = jest.fn().mockReturnThis();
      mockTx.where = jest.fn().mockReturnThis();
      mockTx.for = jest.fn().mockReturnThis();
      mockTx.limit = jest.fn().mockResolvedValue([]);
      mockTx.insert = jest.fn().mockReturnThis();
      mockTx.values = jest.fn().mockResolvedValue(undefined);
      mockTx.update = jest.fn().mockReturnThis();
      mockTx.set = jest.fn().mockReturnThis();

      db.transaction.mockImplementation(async (cb: (tx: any) => Promise<any>) => cb(mockTx));

      const input: CreateInvoiceData = {
        invoiceNumber: "INV-001",
        customerId: "cust-1",
        vehicleId: null,
        discount: "0",
        tax: "0",
        totalAmount: "100.00",
        grandTotal: "100.00",
        paymentMethod: null,
        createdBy: "user-1",
        items: [{ productId: "unknown-prod", quantity: 1, unitPrice: "100.00", total: "100.00" }],
      };

      await expect(repo.createInvoice(input)).rejects.toThrow("PRODUCT_NOT_FOUND");
    });
  });
});
