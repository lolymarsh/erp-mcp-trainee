import {
  createProductSchema,
  updateProductSchema,
  deleteProductSchema,
  stockAdjustSchema,
} from "./schema";

describe("Inventory schemas", () => {
  describe("createProductSchema", () => {
    it("should accept valid input with defaults", () => {
      const result = createProductSchema.parse({
        categoryId: "cat-1",
        sku: "GS-001",
        name: "ถังแก๊ส NGV 60L",
      });
      expect(result.unit).toBe("piece");
      expect(result.costPrice).toBe(0);
      expect(result.sellPrice).toBe(0);
      expect(result.minStock).toBe(0);
      expect(result.currentStock).toBe(0);
    });

    it("should accept all fields", () => {
      const result = createProductSchema.parse({
        categoryId: "cat-1",
        sku: "GS-001",
        name: "ถังแก๊ส",
        description: "60L tank",
        unit: "piece",
        costPrice: 3500,
        sellPrice: 5000,
        minStock: 5,
        currentStock: 10,
      });
      expect(result.sellPrice).toBe(5000);
      expect(result.currentStock).toBe(10);
    });

    it("should reject empty categoryId", () => {
      expect(() =>
        createProductSchema.parse({ categoryId: "", sku: "GS-001", name: "Test" }),
      ).toThrow();
    });

    it("should reject empty sku", () => {
      expect(() =>
        createProductSchema.parse({ categoryId: "cat-1", sku: "", name: "Test" }),
      ).toThrow();
    });

    it("should reject negative price", () => {
      expect(() =>
        createProductSchema.parse({
          categoryId: "cat-1",
          sku: "GS-001",
          name: "Test",
          costPrice: -100,
        }),
      ).toThrow();
    });
  });

  describe("updateProductSchema", () => {
    it("should accept valid input with version", () => {
      const result = updateProductSchema.parse({ name: "Updated", version: 1 });
      expect(result.version).toBe(1);
    });

    it("should reject version = 0", () => {
      expect(() => updateProductSchema.parse({ name: "Updated", version: 0 })).toThrow();
    });

    it("should reject missing version", () => {
      expect(() => updateProductSchema.parse({ name: "Updated" })).toThrow();
    });

    it("should accept partial update", () => {
      const result = updateProductSchema.parse({ version: 2 });
      expect(result.version).toBe(2);
    });

    it("should accept null description", () => {
      const result = updateProductSchema.parse({ description: null, version: 1 });
      expect(result.description).toBeNull();
    });
  });

  describe("deleteProductSchema", () => {
    it("should accept valid version", () => {
      const result = deleteProductSchema.parse({ version: 1 });
      expect(result.version).toBe(1);
    });

    it("should reject version = 0", () => {
      expect(() => deleteProductSchema.parse({ version: 0 })).toThrow();
    });

    it("should reject missing version", () => {
      expect(() => deleteProductSchema.parse({})).toThrow();
    });
  });

  describe("stockAdjustSchema", () => {
    it("should accept valid IN input", () => {
      const result = stockAdjustSchema.parse({ type: "IN", quantity: 5 });
      expect(result.type).toBe("IN");
      expect(result.quantity).toBe(5);
    });

    it("should accept ADJUST with note", () => {
      const result = stockAdjustSchema.parse({
        type: "ADJUST",
        quantity: 100,
        note: "Stock take",
      });
      expect(result.note).toBe("Stock take");
    });

    it("should reject invalid type", () => {
      expect(() => stockAdjustSchema.parse({ type: "INVALID", quantity: 5 })).toThrow();
    });

    it("should accept null optional fields", () => {
      const result = stockAdjustSchema.parse({
        type: "OUT",
        quantity: 3,
        referenceType: null,
        referenceId: null,
        note: null,
      });
      expect(result.referenceType).toBeNull();
    });
  });
});
