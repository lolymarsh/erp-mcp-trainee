/* eslint-disable @typescript-eslint/no-explicit-any */
jest.mock("uuid", () => ({ v4: () => "mocked-uuid" }));

import { InventoryRepository } from "./repo";

function createMockDb() {
  return {
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
    for: jest.fn(),
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

const mockCategory = {
  id: "cat-1",
  name: "ถังแก๊ส",
  description: null,
};

describe("InventoryRepository", () => {
  let db: ReturnType<typeof createMockDb>;
  let repo: InventoryRepository;

  beforeEach(() => {
    db = createMockDb();
    repo = new InventoryRepository(db);
  });

  describe("findFiltered", () => {
    it("should return filtered data with total", async () => {
      const countDb = { select: jest.fn().mockReturnThis(), from: jest.fn().mockReturnThis(), where: jest.fn().mockResolvedValue([{ count: 1 }]) };
      db.select = jest.fn((fields?: any) => fields?.count ? countDb : { from: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), orderBy: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), offset: jest.fn().mockResolvedValue([mockProduct]) });

      const result = await repo.findFiltered({ page: 1, pageSize: 20, sortBy: "desc", filters: [{ field: "sku", operator: "eq", value: "GS-001" }] });
      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
    });
  });

  describe("findById", () => {
    it("should return product when found", async () => {
      db.limit = jest.fn().mockResolvedValue([mockProduct]);
      const result = await repo.findById("prod-1");
      expect(result).toEqual(mockProduct);
    });

    it("should return null when not found", async () => {
      db.limit = jest.fn().mockResolvedValue([]);
      const result = await repo.findById("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("findBySku", () => {
    it("should return product when found", async () => {
      db.limit = jest.fn().mockResolvedValue([mockProduct]);
      const result = await repo.findBySku("GS-001");
      expect(result).toEqual(mockProduct);
    });

    it("should return null when not found", async () => {
      db.limit = jest.fn().mockResolvedValue([]);
      const result = await repo.findBySku("UNKNOWN");
      expect(result).toBeNull();
    });
  });

  describe("findAllCategories", () => {
    it("should return all categories", async () => {
      db.select = jest.fn().mockReturnValue({ from: jest.fn().mockResolvedValue([mockCategory]) });
      const result = await repo.findAllCategories();
      expect(result).toHaveLength(1);
    });
  });

  describe("create", () => {
    it("should insert and return product", async () => {
      db.limit = jest.fn().mockResolvedValue([mockProduct]);
      const result = await repo.create({
        id: "prod-1", categoryId: "cat-1", sku: "GS-001", name: "ถังแก๊ส",
        description: null, unit: "piece", costPrice: "3500.00", sellPrice: "5000.00",
        minStock: 5, currentStock: 10, version: 1,
      });
      expect(db.insert).toHaveBeenCalled();
      expect(result).toEqual(mockProduct);
    });
  });

  describe("update", () => {
    it("should return updated product when affectedRows > 0", async () => {
      const updatedProduct = { ...mockProduct, name: "Updated", version: 2 };
      const whereFn = jest.fn()
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockReturnThis();
      db.where = whereFn;
      db.limit = jest.fn().mockResolvedValue([updatedProduct]);
      const result = await repo.update("prod-1", { name: "Updated" }, 1);
      expect(result).not.toBeNull();
      expect(result!.name).toBe("Updated");
    });

    it("should return null when affectedRows === 0", async () => {
      const whereFn = jest.fn()
        .mockResolvedValueOnce([{ affectedRows: 0 }])
        .mockReturnThis();
      db.where = whereFn;
      const result = await repo.update("prod-1", { name: "Updated" }, 99);
      expect(result).toBeNull();
    });
  });

  describe("softDelete", () => {
    it("should return true when deleted", async () => {
      db.where = jest.fn().mockResolvedValue([{ affectedRows: 1 }]);
      const result = await repo.softDelete("prod-1", 1);
      expect(result).toBe(true);
    });

    it("should return false when not found", async () => {
      db.where = jest.fn().mockResolvedValue([{ affectedRows: 0 }]);
      const result = await repo.softDelete("prod-1", 99);
      expect(result).toBe(false);
    });
  });

  describe("adjustStock", () => {
    function createTxMock(forResult: any[]) {
      return {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        for: jest.fn().mockResolvedValue(forResult),
        insert: jest.fn().mockReturnThis(),
        values: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
    }

    it("should adjust stock IN successfully", async () => {
      const productRow = { ...mockProduct, currentStock: 10 };
      const mockTx = createTxMock([productRow]);
      mockTx.limit = jest.fn().mockResolvedValue([{ ...mockProduct, currentStock: 15 }]);
      db.transaction.mockImplementation(async (cb: (tx: any) => Promise<any>) => cb(mockTx));

      const result = await repo.adjustStock({
        productId: "prod-1", type: "IN", quantity: 5,
        referenceType: null, referenceId: null, createdBy: "user-1", note: null,
      });
      expect(result.product.currentStock).toBe(15);
    });

    it("should throw PRODUCT_NOT_FOUND when product missing", async () => {
      const mockTx = createTxMock([]);
      db.transaction.mockImplementation(async (cb: (tx: any) => Promise<any>) => cb(mockTx));

      await expect(repo.adjustStock({
        productId: "nonexistent", type: "IN", quantity: 5,
        referenceType: null, referenceId: null, createdBy: "user-1", note: null,
      })).rejects.toThrow("PRODUCT_NOT_FOUND");
    });

    it("should throw INSUFFICIENT_STOCK when stock goes negative", async () => {
      const productRow = { ...mockProduct, currentStock: 0 };
      const mockTx = createTxMock([productRow]);
      db.transaction.mockImplementation(async (cb: (tx: any) => Promise<any>) => cb(mockTx));

      await expect(repo.adjustStock({
        productId: "prod-1", type: "OUT", quantity: 5,
        referenceType: null, referenceId: null, createdBy: "user-1", note: null,
      })).rejects.toThrow("INSUFFICIENT_STOCK");
    });
  });
});
