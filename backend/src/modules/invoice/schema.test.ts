import {
  createInvoiceSchema,
  createInvoiceItemSchema,
} from "./schema";

describe("Invoice schemas", () => {
  describe("createInvoiceItemSchema", () => {
    it("should accept valid input", () => {
      const result = createInvoiceItemSchema.parse({ productId: "prod-1", quantity: 2 });
      expect(result.productId).toBe("prod-1");
      expect(result.quantity).toBe(2);
    });

    it("should accept string quantity (coerced)", () => {
      const result = createInvoiceItemSchema.parse({ productId: "prod-1", quantity: "3" });
      expect(result.quantity).toBe(3);
    });

    it("should reject quantity = 0", () => {
      expect(() =>
        createInvoiceItemSchema.parse({ productId: "prod-1", quantity: 0 }),
      ).toThrow();
    });

    it("should reject negative quantity", () => {
      expect(() =>
        createInvoiceItemSchema.parse({ productId: "prod-1", quantity: -1 }),
      ).toThrow();
    });

    it("should reject empty productId", () => {
      expect(() =>
        createInvoiceItemSchema.parse({ productId: "", quantity: 1 }),
      ).toThrow();
    });
  });

  describe("createInvoiceSchema", () => {
    it("should accept valid input with one item", () => {
      const result = createInvoiceSchema.parse({
        customerId: "cust-1",
        items: [{ productId: "prod-1", quantity: 1 }],
      });
      expect(result.customerId).toBe("cust-1");
      expect(result.items).toHaveLength(1);
      expect(result.discount).toBe(0);
    });

    it("should accept input with all fields", () => {
      const result = createInvoiceSchema.parse({
        customerId: "cust-1",
        vehicleId: "veh-1",
        items: [
          { productId: "prod-1", quantity: 2 },
          { productId: "prod-2", quantity: 1 },
        ],
        discount: 100,
        paymentMethod: "CASH",
      });
      expect(result.items).toHaveLength(2);
      expect(result.discount).toBe(100);
      expect(result.paymentMethod).toBe("CASH");
    });

    it("should reject empty items array", () => {
      expect(() =>
        createInvoiceSchema.parse({
          customerId: "cust-1",
          items: [],
        }),
      ).toThrow();
    });

    it("should reject missing customerId", () => {
      expect(() =>
        createInvoiceSchema.parse({
          items: [{ productId: "prod-1", quantity: 1 }],
        }),
      ).toThrow();
    });

    it("should reject invalid paymentMethod", () => {
      expect(() =>
        createInvoiceSchema.parse({
          customerId: "cust-1",
          items: [{ productId: "prod-1", quantity: 1 }],
          paymentMethod: "INVALID",
        }),
      ).toThrow();
    });

    it("should accept null vehicleId and paymentMethod", () => {
      const result = createInvoiceSchema.parse({
        customerId: "cust-1",
        vehicleId: null,
        items: [{ productId: "prod-1", quantity: 1 }],
        paymentMethod: null,
      });
      expect(result.vehicleId).toBeNull();
      expect(result.paymentMethod).toBeNull();
    });
  });
});
