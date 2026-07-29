/* eslint-disable @typescript-eslint/no-explicit-any */
jest.mock("uuid", () => ({ v4: () => "mocked-uuid" }));

import type { Tx } from "../../shared/transaction";
import { InventoryRepository } from "./repo";

function createMockDb() {
  return {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
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
  } as any;
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
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  deletedAt: null,
};

describe("InventoryRepository extra coverage", () => {
  let db: ReturnType<typeof createMockDb>;
  let repo: InventoryRepository;

  beforeEach(() => {
    db = createMockDb();
    repo = new InventoryRepository(db);
  });

  describe("findFiltered", () => {
    it("should handle contains operator", async () => {
      const countDb = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ count: 1 }]),
      };
      db.select = jest.fn((fields?: any) =>
        fields?.count
          ? countDb
          : { from: jest.fn().mockReturnThis(), leftJoin: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), orderBy: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), offset: jest.fn().mockResolvedValue([mockProduct]) },
      );
      const result = await repo.FindFiltered({ page: 1, pageSize: 20, sortBy: "desc", filters: [{ field: "name", operator: "contains", value: "แก๊ส" }] });
      expect(result.total).toBe(1);
    });

    it("should handle neq operator", async () => {
      const countDb = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ count: 1 }]),
      };
      db.select = jest.fn((fields?: any) =>
        fields?.count
          ? countDb
          : { from: jest.fn().mockReturnThis(), leftJoin: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), orderBy: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), offset: jest.fn().mockResolvedValue([mockProduct]) },
      );
      const result = await repo.FindFiltered({ page: 1, pageSize: 20, sortBy: "desc", filters: [{ field: "sku", operator: "neq", value: "UNKNOWN" }] });
      expect(result.total).toBe(1);
    });

    it("should handle sort by name and sellPrice", async () => {
      const countDb = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ count: 1 }]),
      };
      db.select = jest.fn((fields?: any) =>
        fields?.count
          ? countDb
          : { from: jest.fn().mockReturnThis(), leftJoin: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), orderBy: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), offset: jest.fn().mockResolvedValue([mockProduct]) },
      );
      const r1 = await repo.FindFiltered({ page: 1, pageSize: 20, sortName: "name", sortBy: "asc", filters: [] });
      expect(r1.total).toBe(1);
      const r2 = await repo.FindFiltered({ page: 1, pageSize: 20, sortName: "sellPrice", sortBy: "asc", filters: [] });
      expect(r2.total).toBe(1);
    });

    it("should handle sort by currentStock and updatedAt", async () => {
      const countDb = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ count: 1 }]),
      };
      db.select = jest.fn((fields?: any) =>
        fields?.count
          ? countDb
          : { from: jest.fn().mockReturnThis(), leftJoin: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), orderBy: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), offset: jest.fn().mockResolvedValue([mockProduct]) },
      );
      const r1 = await repo.FindFiltered({ page: 1, pageSize: 20, sortName: "currentStock", sortBy: "desc", filters: [] });
      expect(r1.total).toBe(1);
      const r2 = await repo.FindFiltered({ page: 1, pageSize: 20, sortName: "updatedAt", sortBy: "desc", filters: [] });
      expect(r2.total).toBe(1);
    });
  });

  describe("findByIdWithMovements", () => {
    it("should return product with movements", async () => {
      db.limit = jest.fn().mockResolvedValueOnce([mockProduct]);
      db.orderBy = jest.fn().mockResolvedValue([{ id: "mov-1", productId: "prod-1", type: "IN", quantity: 5, createdAt: new Date() }]);
      db.where = jest.fn()
        .mockReturnValueOnce(db)
        .mockReturnValue({ orderBy: db.orderBy });

      const result = await repo.FindByIdWithMovements("prod-1");
      expect(result).not.toBeNull();
      expect(result!.product.id).toBe("prod-1");
      expect(result!.movements).toHaveLength(1);
    });

    it("should return null when product not found", async () => {
      db.limit = jest.fn().mockResolvedValue([]);
      const result = await repo.FindByIdWithMovements("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("adjustStock", () => {
    function createTxMock(forResult: any[]) {
      const txMock = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        for: jest.fn().mockResolvedValue(forResult),
        limit: jest.fn().mockResolvedValue(forResult),
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        values: jest.fn().mockResolvedValue(undefined),
      };
      return txMock;
    }

    it("should adjust stock ADJUST type successfully", async () => {
      const productRow = { ...mockProduct, currentStock: 10 };
      const mockTx = createTxMock([productRow]);
      mockTx.limit = jest.fn().mockResolvedValue([{ ...mockProduct, currentStock: 50 }]);

      const result = await repo.AdjustStock({
        productId: "prod-1", type: "ADJUST", quantity: 50,
        referenceType: null, referenceId: null, createdBy: "user-1", note: null,
      }, mockTx as unknown as Tx);
      expect(result.product.currentStock).toBe(50);
    });
  });
});
