/* eslint-disable @typescript-eslint/no-explicit-any */
jest.mock("uuid", () => {
  let counter = 0;
  return { v4: jest.fn(() => { counter += 1; return `mocked-uuid-${counter}`; }) };
});

import type { Tx } from "../../shared/transaction";
import { InvoiceRepository } from "./repo";
import type { CreateInvoiceData } from "./repo";

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

describe("InvoiceRepository extra coverage", () => {
  let db: any;
  let repo: InvoiceRepository;

  beforeEach(() => {
    db = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      transaction: jest.fn(),
      for: jest.fn().mockReturnThis(),
    };
    repo = new InvoiceRepository(db);
  });

  describe("findFiltered", () => {
    it("should handle various operators", async () => {
      const countDb = { select: jest.fn().mockReturnThis(), from: jest.fn().mockReturnThis(), where: jest.fn().mockResolvedValue([{ count: 1 }]) };
      db.select = jest.fn((fields?: any) => fields?.count ? countDb : { from: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), orderBy: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), offset: jest.fn().mockResolvedValue([mockInvoiceEntity]) });

      const r1 = await repo.findFiltered({ page: 1, pageSize: 20, sortBy: "desc", filters: [{ field: "paymentStatus", operator: "neq", value: "REFUNDED" }] });
      expect(r1.total).toBe(1);

      const r2 = await repo.findFiltered({ page: 1, pageSize: 20, sortBy: "desc", filters: [{ field: "invoiceNumber", operator: "contains", value: "INV" }] });
      expect(r2.total).toBe(1);

      const r3 = await repo.findFiltered({ page: 1, pageSize: 20, sortBy: "desc", filters: [{ field: "paymentStatus", operator: "in", value: ["PENDING", "PAID"] }] });
      expect(r3.total).toBe(1);
    });

    it("should handle sort by grandTotal and paymentStatus", async () => {
      const countDb = { select: jest.fn().mockReturnThis(), from: jest.fn().mockReturnThis(), where: jest.fn().mockResolvedValue([{ count: 1 }]) };
      db.select = jest.fn((fields?: any) => fields?.count ? countDb : { from: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), orderBy: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), offset: jest.fn().mockResolvedValue([mockInvoiceEntity]) });

      const r1 = await repo.findFiltered({ page: 1, pageSize: 20, sortName: "grandTotal", sortBy: "desc", filters: [] });
      expect(r1.total).toBe(1);

      const r2 = await repo.findFiltered({ page: 1, pageSize: 20, sortName: "paymentStatus", sortBy: "asc", filters: [] });
      expect(r2.total).toBe(1);
    });

    it("should skip unknown filter fields", async () => {
      const countDb = { select: jest.fn().mockReturnThis(), from: jest.fn().mockReturnThis(), where: jest.fn().mockResolvedValue([{ count: 1 }]) };
      db.select = jest.fn((fields?: any) => fields?.count ? countDb : { from: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), orderBy: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), offset: jest.fn().mockResolvedValue([mockInvoiceEntity]) });

      const result = await repo.findFiltered({ page: 1, pageSize: 20, sortBy: "desc", filters: [{ field: "nonexistent", operator: "eq", value: "x" }] });
      expect(result.total).toBe(1);
    });
  });

  describe("findByIdWithItems", () => {
    it("should return invoice with items", async () => {
      db.limit = jest.fn().mockResolvedValueOnce([mockInvoiceEntity]);
      db.where = jest.fn()
        .mockReturnValueOnce(db)
        .mockResolvedValueOnce([{ id: "item-1", invoiceId: "inv-1", productId: "prod-1", quantity: 1, unitPrice: "5000.00", total: "5000.00" }]);

      const result = await repo.findByIdWithItems("inv-1");
      expect(result).not.toBeNull();
      expect(result!.invoice.id).toBe("inv-1");
      expect(result!.items).toHaveLength(1);
    });

    it("should return null when invoice not found", async () => {
      db.limit = jest.fn().mockResolvedValue([]);
      const result = await repo.findByIdWithItems("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("createInvoice", () => {
    function createTxMock(forResult: any[]) {
      const txMock = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        for: jest.fn().mockResolvedValue(forResult),
        insert: jest.fn().mockReturnThis(),
        values: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
      };
      return txMock;
    }

    it("should throw INSUFFICIENT_STOCK when stock too low", async () => {
      const productRow = { id: "prod-1", currentStock: 0, deletedAt: null };
      const mockTx = createTxMock([productRow]);

      const input: CreateInvoiceData = {
        invoiceNumber: "INV-001", customerId: "cust-1", vehicleId: null,
        discount: "0", tax: "0", totalAmount: "100.00", grandTotal: "100.00",
        paymentMethod: null, createdBy: "user-1",
        items: [{ productId: "prod-1", quantity: 1, unitPrice: "100.00", total: "100.00" }],
      };

      await expect(repo.createInvoice(input, mockTx as unknown as Tx)).rejects.toThrow("INSUFFICIENT_STOCK");
    });
  });

  describe("getTodaySummary", () => {
    it("should return today summary", async () => {
      db.where = jest.fn().mockResolvedValue([{ totalAmount: "15000.00", count: 3 }]);
      const result = await repo.getTodaySummary();
      expect(result.totalAmount).toBe("15000.00");
      expect(result.count).toBe(3);
    });

    it("should return zeros when no invoices today", async () => {
      db.where = jest.fn().mockResolvedValue([]);
      const result = await repo.getTodaySummary();
      expect(result.totalAmount).toBe("0.00");
      expect(result.count).toBe(0);
    });
  });
});
