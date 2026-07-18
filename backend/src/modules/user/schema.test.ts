import { loginSchema, createUserSchema, updateProfileSchema } from "./schema";

describe("User schemas", () => {
  describe("loginSchema", () => {
    it("should accept valid input", () => {
      const result = loginSchema.parse({ username: "admin", password: "secret" });
      expect(result.username).toBe("admin");
      expect(result.password).toBe("secret");
    });

    it("should reject empty username", () => {
      expect(() => loginSchema.parse({ username: "", password: "secret" })).toThrow();
    });

    it("should reject empty password", () => {
      expect(() => loginSchema.parse({ username: "admin", password: "" })).toThrow();
    });
  });

  describe("createUserSchema", () => {
    it("should accept valid input", () => {
      const result = createUserSchema.parse({
        username: "newuser",
        password: "pass123",
        displayName: "New User",
        role: "STAFF",
      });
      expect(result.role).toBe("STAFF");
    });

    it("should reject password shorter than 6 chars", () => {
      expect(() =>
        createUserSchema.parse({
          username: "newuser",
          password: "12345",
          displayName: "New",
          role: "STAFF",
        }),
      ).toThrow();
    });

    it("should reject invalid role", () => {
      expect(() =>
        createUserSchema.parse({
          username: "newuser",
          password: "pass123",
          displayName: "New",
          role: "INVALID",
        }),
      ).toThrow();
    });

    it("should reject empty displayName", () => {
      expect(() =>
        createUserSchema.parse({
          username: "newuser",
          password: "pass123",
          displayName: "",
          role: "STAFF",
        }),
      ).toThrow();
    });
  });

  describe("updateProfileSchema", () => {
    it("should accept valid input with version", () => {
      const result = updateProfileSchema.parse({ displayName: "Updated", version: 1 });
      expect(result.version).toBe(1);
    });

    it("should reject version < 1", () => {
      expect(() => updateProfileSchema.parse({ displayName: "Updated", version: 0 })).toThrow();
    });

    it("should accept empty object with version only", () => {
      const result = updateProfileSchema.parse({ version: 2 });
      expect(result.version).toBe(2);
    });

    it("should reject missing version", () => {
      expect(() => updateProfileSchema.parse({ displayName: "Updated" })).toThrow();
    });

    it("should accept all fields", () => {
      const result = updateProfileSchema.parse({
        displayName: "Updated",
        role: "MANAGER",
        version: 1,
      });
      expect(result.displayName).toBe("Updated");
      expect(result.role).toBe("MANAGER");
    });
  });
});
