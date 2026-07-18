import { createCustomerSchema, updateCustomerSchema, deleteCustomerSchema } from "./schema";

describe("Customer schemas", () => {
  describe("createCustomerSchema", () => {
    it("should accept valid input", () => {
      const result = createCustomerSchema.parse({
        firstName: "สมชาย",
        lastName: "ใจดี",
        phone: "0812345678",
      });
      expect(result.firstName).toBe("สมชาย");
      expect(result.phone).toBe("0812345678");
    });

    it("should accept valid input with all fields", () => {
      const result = createCustomerSchema.parse({
        firstName: "สมชาย",
        lastName: "ใจดี",
        phone: "0812345678",
        email: "somchai@email.com",
        address: "123 ถนนสุขุมวิท",
      });
      expect(result.email).toBe("somchai@email.com");
      expect(result.address).toBe("123 ถนนสุขุมวิท");
    });

    it("should reject empty firstName", () => {
      expect(() =>
        createCustomerSchema.parse({ firstName: "", lastName: "ใจดี", phone: "0812345678" }),
      ).toThrow();
    });

    it("should reject missing lastName", () => {
      expect(() =>
        createCustomerSchema.parse({ firstName: "สมชาย", phone: "0812345678" }),
      ).toThrow();
    });

    it("should reject missing phone", () => {
      expect(() =>
        createCustomerSchema.parse({ firstName: "สมชาย", lastName: "ใจดี" }),
      ).toThrow();
    });

    it("should accept null email and address", () => {
      const result = createCustomerSchema.parse({
        firstName: "สมชาย",
        lastName: "ใจดี",
        phone: "0812345678",
        email: null,
        address: null,
      });
      expect(result.email).toBeNull();
      expect(result.address).toBeNull();
    });
  });

  describe("updateCustomerSchema", () => {
    it("should accept valid input with version", () => {
      const result = updateCustomerSchema.parse({ firstName: "Updated", version: 1 });
      expect(result.version).toBe(1);
    });

    it("should reject version = 0", () => {
      expect(() => updateCustomerSchema.parse({ firstName: "Updated", version: 0 })).toThrow();
    });

    it("should reject missing version", () => {
      expect(() => updateCustomerSchema.parse({ firstName: "Updated" })).toThrow();
    });

    it("should accept partial update without optional fields", () => {
      const result = updateCustomerSchema.parse({ version: 1 });
      expect(result.version).toBe(1);
    });

    it("should accept null email", () => {
      const result = updateCustomerSchema.parse({ email: null, version: 1 });
      expect(result.email).toBeNull();
    });
  });

  describe("deleteCustomerSchema", () => {
    it("should accept valid version", () => {
      const result = deleteCustomerSchema.parse({ version: 1 });
      expect(result.version).toBe(1);
    });

    it("should reject version = 0", () => {
      expect(() => deleteCustomerSchema.parse({ version: 0 })).toThrow();
    });

    it("should reject missing version", () => {
      expect(() => deleteCustomerSchema.parse({})).toThrow();
    });
  });
});
