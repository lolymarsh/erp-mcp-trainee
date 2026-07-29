/* eslint-disable @typescript-eslint/no-explicit-any */
import { CustomerRepository } from "./repo";

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
  } as any;
}

const mockCustomer = {
  id: "cust-1",
  firstName: "สมชาย",
  lastName: "ใจดี",
  phone: "0812345678",
  email: "somchai@email.com",
  address: "123 ถนนสุขุมวิท",
  version: 1,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  deletedAt: null,
};

const mockVehicle = {
  id: "veh-1",
  customerId: "cust-1",
  licensePlate: "กข 1234",
  brand: "Toyota",
  model: "Vios",
  year: 2020,
  engineType: "GASOLINE",
  fuelType: "GASOLINE",
};

describe("CustomerRepository", () => {
  let db: ReturnType<typeof createMockDb>;
  let repo: CustomerRepository;

  beforeEach(() => {
    db = createMockDb();
    repo = new CustomerRepository(db);
  });

  describe("findFiltered", () => {
    it("should return filtered data with total", async () => {
      const countDb = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ count: 1 }]),
      };
      db.select = jest.fn((fields?: any) =>
        fields?.count
          ? countDb
          : {
              from: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              offset: jest.fn().mockResolvedValue([mockCustomer]),
            },
      );

      const result = await repo.FindFiltered({
        page: 1,
        pageSize: 20,
        sortBy: "desc",
        filters: [{ field: "firstName", operator: "contains", value: "สมชาย" }],
      });
      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].firstName).toBe("สมชาย");
    });

    it("should return empty when no filters and no data", async () => {
      const countDb = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ count: 0 }]),
      };
      db.select = jest.fn((fields?: any) =>
        fields?.count
          ? countDb
          : {
              from: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              offset: jest.fn().mockResolvedValue([]),
            },
      );

      const result = await repo.FindFiltered({
        page: 1,
        pageSize: 20,
        sortBy: "desc",
        filters: [],
      });
      expect(result.total).toBe(0);
      expect(result.data).toHaveLength(0);
    });

    it("should handle neq operator", async () => {
      const countDb = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ count: 2 }]),
      };
      db.select = jest.fn((fields?: any) =>
        fields?.count
          ? countDb
          : {
              from: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              offset: jest.fn().mockResolvedValue([mockCustomer]),
            },
      );

      const result = await repo.FindFiltered({
        page: 1,
        pageSize: 20,
        sortBy: "desc",
        filters: [{ field: "phone", operator: "neq", value: "0000000000" }],
      });
      expect(result.total).toBe(2);
    });

    it("should handle sort by firstName asc", async () => {
      const countDb = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ count: 1 }]),
      };
      db.select = jest.fn((fields?: any) =>
        fields?.count
          ? countDb
          : {
              from: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              offset: jest.fn().mockResolvedValue([mockCustomer]),
            },
      );

      const result = await repo.FindFiltered({
        page: 1,
        pageSize: 20,
        sortName: "firstName",
        sortBy: "asc",
        filters: [],
      });
      expect(result.total).toBe(1);
    });

    it("should handle sort by updatedAt desc", async () => {
      const countDb = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ count: 1 }]),
      };
      db.select = jest.fn((fields?: any) =>
        fields?.count
          ? countDb
          : {
              from: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              offset: jest.fn().mockResolvedValue([mockCustomer]),
            },
      );

      const result = await repo.FindFiltered({
        page: 1,
        pageSize: 20,
        sortName: "updatedAt",
        sortBy: "desc",
        filters: [],
      });
      expect(result.total).toBe(1);
    });

    it("should handle in operator", async () => {
      const countDb = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ count: 1 }]),
      };
      db.select = jest.fn((fields?: any) =>
        fields?.count
          ? countDb
          : {
              from: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              offset: jest.fn().mockResolvedValue([mockCustomer]),
            },
      );

      const result = await repo.FindFiltered({
        page: 1,
        pageSize: 20,
        sortBy: "desc",
        filters: [{ field: "firstName", operator: "in", value: ["สมชาย", "สมหญิง"] }],
      });
      expect(result.total).toBe(1);
    });

    it("should skip unknown filter fields", async () => {
      const countDb = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ count: 1 }]),
      };
      db.select = jest.fn((fields?: any) =>
        fields?.count
          ? countDb
          : {
              from: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              offset: jest.fn().mockResolvedValue([mockCustomer]),
            },
      );

      const result = await repo.FindFiltered({
        page: 1,
        pageSize: 20,
        sortBy: "desc",
        filters: [{ field: "unknownField", operator: "eq", value: "test" }],
      });
      expect(result.total).toBe(1);
    });
  });

  describe("findById", () => {
    it("should return customer when found", async () => {
      db.limit = jest.fn().mockResolvedValue([mockCustomer]);
      const result = await repo.FindById("cust-1");
      expect(result).toEqual(mockCustomer);
    });

    it("should return null when not found", async () => {
      db.limit = jest.fn().mockResolvedValue([]);
      const result = await repo.FindById("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("findByIdWithVehicles", () => {
    it("should return customer with vehicles when found", async () => {
      db.limit = jest.fn().mockResolvedValueOnce([mockCustomer]);
      db.where = jest.fn()
        .mockReturnValueOnce(db)
        .mockResolvedValueOnce([mockVehicle]);

      const result = await repo.FindByIdWithVehicles("cust-1");
      expect(result).not.toBeNull();
      expect(result!.customer.id).toBe("cust-1");
      expect(result!.vehicles).toHaveLength(1);
    });

    it("should return null when customer not found", async () => {
      db.limit = jest.fn().mockResolvedValue([]);
      const result = await repo.FindByIdWithVehicles("nonexistent");
      expect(result).toBeNull();
    });

    it("should return customer with empty vehicles array", async () => {
      db.limit = jest.fn().mockResolvedValueOnce([mockCustomer]);
      db.where = jest.fn()
        .mockReturnValueOnce(db)
        .mockResolvedValueOnce([]);

      const result = await repo.FindByIdWithVehicles("cust-1");
      expect(result).not.toBeNull();
      expect(result!.vehicles).toHaveLength(0);
    });
  });

  describe("findByPhone", () => {
    it("should return customer when found", async () => {
      db.limit = jest.fn().mockResolvedValue([mockCustomer]);
      const result = await repo.FindByPhone("0812345678");
      expect(result).toEqual(mockCustomer);
    });

    it("should return null when not found", async () => {
      db.limit = jest.fn().mockResolvedValue([]);
      const result = await repo.FindByPhone("0000000000");
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("should insert and return customer", async () => {
      db.limit = jest.fn().mockResolvedValue([mockCustomer]);
      const result = await repo.Create({
        id: "cust-new",
        firstName: "ใหม่",
        lastName: "สุดสวย",
        phone: "0899999999",
        email: null,
        address: null,
        version: 1,
      });
      expect(db.insert).toHaveBeenCalled();
      expect(result).toEqual(mockCustomer);
    });
  });

  describe("update", () => {
    it("should return updated customer when affectedRows > 0", async () => {
      const updatedCustomer = { ...mockCustomer, firstName: "สมหมาย", version: 2 };
      const whereFn = jest
        .fn()
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockReturnThis();
      db.where = whereFn;
      db.limit = jest.fn().mockResolvedValue([updatedCustomer]);

      const result = await repo.Update("cust-1", { firstName: "สมหมาย" }, 1);
      expect(result).not.toBeNull();
      expect(result!.firstName).toBe("สมหมาย");
      expect(result!.version).toBe(2);
    });

    it("should return null when affectedRows === 0 (version mismatch)", async () => {
      const whereFn = jest
        .fn()
        .mockResolvedValueOnce([{ affectedRows: 0 }])
        .mockReturnThis();
      db.where = whereFn;

      const result = await repo.Update("cust-1", { firstName: "สมหมาย" }, 99);
      expect(result).toBeNull();
    });
  });

  describe("softDelete", () => {
    it("should return true when deleted", async () => {
      db.where = jest.fn().mockResolvedValue([{ affectedRows: 1 }]);
      const result = await repo.SoftDelete("cust-1", 1);
      expect(result).toBe(true);
    });

    it("should return false when version mismatch", async () => {
      db.where = jest.fn().mockResolvedValue([{ affectedRows: 0 }]);
      const result = await repo.SoftDelete("cust-1", 99);
      expect(result).toBe(false);
    });
  });
});
