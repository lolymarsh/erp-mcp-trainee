/* eslint-disable @typescript-eslint/no-explicit-any */
jest.mock("uuid", () => {
  let counter = 0;
  return { v4: jest.fn(() => { counter += 1; return `mocked-uuid-${counter}`; }) };
});

import type { Tx } from "../../shared/transaction";
import { JobRepository } from "./repo";
import type { CreateJobData } from "./repo";

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
    for: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
  } as any;
}

const mockJob = {
  id: "job-1",
  customerId: "cust-1",
  vehicleId: "veh-1",
  invoiceId: null,
  jobType: "INSTALL" as const,
  status: "QUEUED" as const,
  scheduledDate: new Date("2026-07-19"),
  startTime: null,
  endTime: null,
  technicianId: "tech-1",
  notes: "Install LPG kit",
  version: 1,
  createdAt: new Date("2026-07-18"),
  updatedAt: new Date("2026-07-18"),
};

const mockLog = {
  id: "log-1",
  jobId: "job-1",
  fromStatus: "QUEUED" as const,
  toStatus: "IN_PROGRESS" as const,
  changedBy: "user-1",
  note: null,
  createdAt: new Date("2026-07-18"),
};

describe("JobRepository", () => {
  let db: ReturnType<typeof createMockDb>;
  let repo: JobRepository;

  beforeEach(() => {
    db = createMockDb();
    repo = new JobRepository(db);
  });

  describe("findFiltered", () => {
    it("should return filtered data with total", async () => {
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
              offset: jest.fn().mockResolvedValue([mockJob]),
            },
      );

      const result = await repo.findFiltered({
        page: 1, pageSize: 20, sortBy: "desc",
        filters: [{ field: "status", operator: "eq", value: "QUEUED" }],
      });
      expect(result.total).toBe(2);
      expect(result.data).toHaveLength(1);
    });

    it("should return empty when no filters", async () => {
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

      const result = await repo.findFiltered({
        page: 1, pageSize: 20, sortBy: "desc", filters: [],
      });
      expect(result.total).toBe(0);
      expect(result.data).toHaveLength(0);
    });

    it("should handle sort by scheduledDate", async () => {
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
              offset: jest.fn().mockResolvedValue([mockJob]),
            },
      );

      const result = await repo.findFiltered({
        page: 1, pageSize: 20, sortName: "scheduledDate", sortBy: "asc", filters: [],
      });
      expect(result.total).toBe(1);
    });

    it("should handle in operator with single value", async () => {
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
              offset: jest.fn().mockResolvedValue([mockJob]),
            },
      );

      const result = await repo.findFiltered({
        page: 1, pageSize: 20, sortBy: "desc",
        filters: [{ field: "status", operator: "in", value: "QUEUED" }],
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
              offset: jest.fn().mockResolvedValue([mockJob]),
            },
      );

      const result = await repo.findFiltered({
        page: 1, pageSize: 20, sortBy: "desc",
        filters: [{ field: "unknown", operator: "eq", value: "x" }],
      });
      expect(result.total).toBe(1);
    });
  });

  describe("findById", () => {
    it("should return job when found", async () => {
      db.limit = jest.fn().mockResolvedValue([mockJob]);
      const result = await repo.findById("job-1");
      expect(result).toEqual(mockJob);
    });

    it("should return null when not found", async () => {
      db.limit = jest.fn().mockResolvedValue([]);
      const result = await repo.findById("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("findByIdWithLogs", () => {
    it("should return job with logs when found", async () => {
      db.limit = jest.fn().mockResolvedValueOnce([mockJob]);
      const mockOrderBy = jest.fn().mockResolvedValue([mockLog]);
      db.where = jest.fn()
        .mockReturnValueOnce(db)
        .mockReturnValue({ orderBy: mockOrderBy });

      const result = await repo.findByIdWithLogs("job-1");
      expect(result).not.toBeNull();
      expect(result!.job.id).toBe("job-1");
      expect(result!.logs).toHaveLength(1);
    });

    it("should return null when job not found", async () => {
      db.limit = jest.fn().mockResolvedValue([]);
      const result = await repo.findByIdWithLogs("nonexistent");
      expect(result).toBeNull();
    });

    it("should return job with empty logs", async () => {
      db.limit = jest.fn().mockResolvedValueOnce([mockJob]);
      const mockOrderBy = jest.fn().mockResolvedValue([]);
      db.where = jest.fn()
        .mockReturnValueOnce(db)
        .mockReturnValue({ orderBy: mockOrderBy });

      const result = await repo.findByIdWithLogs("job-1");
      expect(result).not.toBeNull();
      expect(result!.logs).toHaveLength(0);
    });
  });

  describe("create", () => {
    it("should insert and return job", async () => {
      db.values.mockResolvedValue(undefined);

      const input: CreateJobData = {
        customerId: "cust-1",
        vehicleId: "veh-1",
        invoiceId: null,
        jobType: "INSTALL",
        scheduledDate: new Date("2026-07-19"),
        technicianId: "tech-1",
        notes: "Install LPG kit",
      };

      const result = await repo.create(input);
      expect(db.insert).toHaveBeenCalled();
      expect(result.customerId).toBe("cust-1");
      expect(result.status).toBe("QUEUED");
      expect(result.version).toBe(1);
    });
  });

  describe("updateStatus", () => {
    function createTxMock(forResult: any[]) {
      const txMock = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        for: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(forResult),
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        values: jest.fn().mockResolvedValue(undefined),
      };
      return txMock;
    }

    it("should execute transaction successfully (QUEUED → IN_PROGRESS)", async () => {
      const mockTx = createTxMock([mockJob]);

      const result = await repo.updateStatus("job-1", "IN_PROGRESS", "user-1", 1, null, mockTx as unknown as Tx);

      expect(result.job.status).toBe("IN_PROGRESS");
      expect(result.job.version).toBe(2);
      expect(result.log.fromStatus).toBe("QUEUED");
      expect(result.log.toStatus).toBe("IN_PROGRESS");
      expect(mockTx.update).toHaveBeenCalled();
      expect(mockTx.insert).toHaveBeenCalled();
    });

    it("should set startTime when moving to IN_PROGRESS", async () => {
      const mockTx = createTxMock([{ ...mockJob, startTime: null }]);

      const result = await repo.updateStatus("job-1", "IN_PROGRESS", "user-1", 1, null, mockTx as unknown as Tx);

      expect(result.job.startTime).toBeInstanceOf(Date);
    });

    it("should set endTime when moving to COMPLETED", async () => {
      const mockTx = createTxMock([{ ...mockJob, status: "IN_PROGRESS" as const, endTime: null }]);

      const result = await repo.updateStatus("job-1", "COMPLETED", "user-1", 1, null, mockTx as unknown as Tx);

      expect(result.job.endTime).toBeInstanceOf(Date);
      expect(result.job.status).toBe("COMPLETED");
    });

    it("should throw VERSION_MISMATCH when version does not match", async () => {
      const mockTx = createTxMock([{ ...mockJob, version: 5 }]);

      await expect(
        repo.updateStatus("job-1", "IN_PROGRESS", "user-1", 1, null, mockTx as unknown as Tx),
      ).rejects.toThrow("VERSION_MISMATCH");
    });

    it("should throw JOB_NOT_FOUND when job missing", async () => {
      const mockTx = createTxMock([]);

      await expect(
        repo.updateStatus("nonexistent", "IN_PROGRESS", "user-1", 1, null, mockTx as unknown as Tx),
      ).rejects.toThrow("JOB_NOT_FOUND");
    });
  });

  describe("getTodayQueue", () => {
    it("should return correct counts for all statuses", async () => {
      db.where = jest.fn().mockReturnThis();
      db.groupBy = jest.fn().mockResolvedValue([
        { status: "QUEUED", count: 5 },
        { status: "IN_PROGRESS", count: 3 },
        { status: "COMPLETED", count: 2 },
      ]);

      const result = await repo.getTodayQueue();

      expect(result.queued).toBe(5);
      expect(result.inProgress).toBe(3);
      expect(result.completed).toBe(2);
    });

    it("should return zero for missing statuses", async () => {
      db.where = jest.fn().mockReturnThis();
      db.groupBy = jest.fn().mockResolvedValue([]);

      const result = await repo.getTodayQueue();

      expect(result.queued).toBe(0);
      expect(result.inProgress).toBe(0);
      expect(result.completed).toBe(0);
    });
  });
});
