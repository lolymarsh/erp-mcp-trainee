/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserRepository } from "./repo";
import type { UserEntity } from "./entity";

function createMockDb() {
  return {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
  } as any;
}

const mockUserEntity: UserEntity = {
  id: "user-1",
  username: "admin",
  passwordHash: "hash",
  displayName: "Admin",
  role: "ADMIN",
  isActive: true,
  version: 1,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  deletedAt: null,
};

describe("UserRepository", () => {
  let db: ReturnType<typeof createMockDb>;
  let repo: UserRepository;

  beforeEach(() => {
    db = createMockDb();
    repo = new UserRepository(db);
  });

  describe("FindById", () => {
    it("should return user when found", async () => {
      db.limit.mockResolvedValue([mockUserEntity]);
      const result = await repo.FindById("user-1");
      expect(result).toEqual(mockUserEntity);
      expect(db.select).toHaveBeenCalled();
      expect(db.where).toHaveBeenCalled();
    });

    it("should return null when not found", async () => {
      db.limit.mockResolvedValue([]);
      const result = await repo.FindById("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("FindByUsername", () => {
    it("should return user when found", async () => {
      db.limit.mockResolvedValue([mockUserEntity]);
      const result = await repo.FindByUsername("admin");
      expect(result).toEqual(mockUserEntity);
    });

    it("should return null when not found", async () => {
      db.limit.mockResolvedValue([]);
      const result = await repo.FindByUsername("unknown");
      expect(result).toBeNull();
    });
  });

  describe("Create", () => {
    it("should insert and return data", async () => {
      db.values.mockResolvedValue(undefined);
      const data = { id: "user-2", username: "newuser", passwordHash: "hash", displayName: "New", role: "STAFF" as const, isActive: true, version: 1 };
      const result = await repo.Create(data);
      expect(db.insert).toHaveBeenCalled();
      expect(db.values).toHaveBeenCalledWith(data);
      expect(result).toEqual(data);
    });
  });

  describe("Update", () => {
    it("should return updated user when affectedRows > 0", async () => {
      db.set.mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue([{ affectedRows: 1 }]);
      db.where = mockWhere;
      const findBySpy = jest.spyOn(repo, "FindById").mockResolvedValue({ ...mockUserEntity, displayName: "Updated", version: 2 });

      const result = await repo.Update("user-1", { displayName: "Updated" }, 1);
      expect(result).not.toBeNull();
      expect(result!.displayName).toBe("Updated");
      findBySpy.mockRestore();
    });

    it("should return null when affectedRows === 0", async () => {
      const mockWhere = jest.fn().mockResolvedValue([{ affectedRows: 0 }]);
      db.where = mockWhere;
      const result = await repo.Update("user-1", { displayName: "Updated" }, 99);
      expect(result).toBeNull();
    });
  });

  describe("FindFiltered", () => {
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
              offset: jest.fn().mockResolvedValue([mockUserEntity]),
            },
      );

      const result = await repo.FindFiltered({ page: 1, pageSize: 20, sortBy: "desc" });
      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe("user-1");
    });
  });

  describe("SoftDelete", () => {
    it("should return true when affectedRows > 0", async () => {
      const mockWhere = jest.fn().mockResolvedValue([{ affectedRows: 1 }]);
      db.where = mockWhere;
      const result = await repo.SoftDelete("user-1", 1);
      expect(result).toBe(true);
    });

    it("should return false when affectedRows === 0", async () => {
      const mockWhere = jest.fn().mockResolvedValue([{ affectedRows: 0 }]);
      db.where = mockWhere;
      const result = await repo.SoftDelete("user-1", 99);
      expect(result).toBe(false);
    });
  });

  describe("FindAll", () => {
    it("should return all non-deleted users", async () => {
      db.where = jest.fn().mockResolvedValue([mockUserEntity]);
      const result = await repo.FindAll();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("user-1");
    });
  });
});
