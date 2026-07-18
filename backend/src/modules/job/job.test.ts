jest.mock("uuid", () => {
  let counter = 0;
  return {
    v4: jest.fn(() => {
      counter += 1;
      return `mocked-uuid-job-${counter}`;
    }),
  };
});

import Redis from "ioredis";
import { JobService } from "./service";
import type { IJobRepository } from "./repo";
import type { MySql2Database } from "drizzle-orm/mysql2";
import {
  NotFoundError,
  BadRequestError,
} from "../../shared/errors/AppError";

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

describe("JobService", () => {
  let repo: jest.Mocked<IJobRepository>;
  let db: Partial<MySql2Database>;
  let redis: jest.Mocked<Redis>;
  let svc: JobService;

  beforeEach(() => {
    repo = {
      findFiltered: jest.fn(),
      findById: jest.fn(),
      findByIdWithLogs: jest.fn(),
      create: jest.fn(),
      updateStatus: jest.fn(),
      getTodayQueue: jest.fn(),
    };
    db = {
      select: jest.fn(),
    };
    redis = { del: jest.fn() } as unknown as jest.Mocked<Redis>;
    svc = new JobService(repo, db as MySql2Database, redis);
  });

  describe("filter", () => {
    it("should return paginated jobs", async () => {
      repo.findFiltered.mockResolvedValue({
        data: [mockJob],
        total: 1,
      });

      const result = await svc.filter({
        page: 1,
        pageSize: 20,
        sortBy: "desc",
        filters: [],
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe("job-1");
      expect(result.data[0].status).toBe("QUEUED");
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalData).toBe(1);
    });

    it("should return empty list when no jobs", async () => {
      repo.findFiltered.mockResolvedValue({ data: [], total: 0 });

      const result = await svc.filter({
        page: 1,
        pageSize: 20,
        sortBy: "desc",
        filters: [],
      });

      expect(result.data).toHaveLength(0);
      expect(result.pagination.hasNextPage).toBe(false);
    });

    it("should filter by status", async () => {
      repo.findFiltered.mockResolvedValue({
        data: [{ ...mockJob, status: "IN_PROGRESS" as const }],
        total: 1,
      });

      const result = await svc.filter({
        page: 1,
        pageSize: 20,
        sortBy: "desc",
        filters: [
          { field: "status", operator: "eq", value: "IN_PROGRESS" },
        ],
      });

      expect(result.data[0].status).toBe("IN_PROGRESS");
    });
  });

  describe("getById", () => {
    it("should throw NotFoundError when job not found", async () => {
      repo.findByIdWithLogs.mockResolvedValue(null);

      await expect(svc.getById("nonexistent")).rejects.toThrow(
        NotFoundError,
      );
    });

    it("should return job with status logs", async () => {
      repo.findByIdWithLogs.mockResolvedValue({
        job: mockJob,
        logs: [mockLog],
      });

      const result = await svc.getById("job-1");

      expect(result.id).toBe("job-1");
      expect(result.status).toBe("QUEUED");
      expect(result.statusLogs).toHaveLength(1);
      expect(result.statusLogs[0].toStatus).toBe("IN_PROGRESS");
    });

    it("should return job with empty logs", async () => {
      repo.findByIdWithLogs.mockResolvedValue({
        job: mockJob,
        logs: [],
      });

      const result = await svc.getById("job-1");

      expect(result.statusLogs).toHaveLength(0);
    });
  });

  describe("updateStatus", () => {
    it("should throw NotFoundError when job not found", async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        svc.updateStatus("nonexistent", {
          status: "IN_PROGRESS",
          version: 1,
        }, "user-1"),
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw BadRequestError when status same", async () => {
      repo.findById.mockResolvedValue(mockJob);

      await expect(
        svc.updateStatus("job-1", {
          status: "QUEUED",
          version: 1,
        }, "user-1"),
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw BadRequestError for invalid transition", async () => {
      repo.findById.mockResolvedValue({ ...mockJob, status: "COMPLETED" as const });

      await expect(
        svc.updateStatus("job-1", {
          status: "IN_PROGRESS",
          version: 1,
        }, "user-1"),
      ).rejects.toThrow(BadRequestError);
    });

    it("should allow QUEUED → IN_PROGRESS", async () => {
      repo.findById.mockResolvedValue(mockJob);
      repo.updateStatus.mockResolvedValue({
        job: { ...mockJob, status: "IN_PROGRESS" as const, version: 2 },
        log: mockLog,
      });

      const result = await svc.updateStatus("job-1", {
        status: "IN_PROGRESS",
        version: 1,
      }, "user-1");

      expect(result.job.status).toBe("IN_PROGRESS");
      expect(result.job.version).toBe(2);
      expect(result.log.toStatus).toBe("IN_PROGRESS");
    });

    it("should allow QUEUED → CANCELLED", async () => {
      repo.findById.mockResolvedValue(mockJob);
      repo.updateStatus.mockResolvedValue({
        job: { ...mockJob, status: "CANCELLED" as const, version: 2 },
        log: { ...mockLog, fromStatus: "QUEUED" as const, toStatus: "CANCELLED" as const },
      });

      const result = await svc.updateStatus("job-1", {
        status: "CANCELLED",
        version: 1,
      }, "user-1");

      expect(result.job.status).toBe("CANCELLED");
    });

    it("should allow IN_PROGRESS → COMPLETED", async () => {
      repo.findById.mockResolvedValue({ ...mockJob, status: "IN_PROGRESS" as const });
      repo.updateStatus.mockResolvedValue({
        job: { ...mockJob, status: "COMPLETED" as const, version: 2 },
        log: { ...mockLog, fromStatus: "IN_PROGRESS" as const, toStatus: "COMPLETED" as const },
      });

      const result = await svc.updateStatus("job-1", {
        status: "COMPLETED",
        version: 1,
      }, "user-1");

      expect(result.job.status).toBe("COMPLETED");
    });

    it("should block COMPLETED → IN_PROGRESS", async () => {
      repo.findById.mockResolvedValue({ ...mockJob, status: "COMPLETED" as const });

      await expect(
        svc.updateStatus("job-1", {
          status: "IN_PROGRESS",
          version: 1,
        }, "user-1"),
      ).rejects.toThrow(BadRequestError);
    });

    it("should block CANCELLED → any status", async () => {
      repo.findById.mockResolvedValue({ ...mockJob, status: "CANCELLED" as const });

      await expect(
        svc.updateStatus("job-1", {
          status: "QUEUED",
          version: 1,
        }, "user-1"),
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("getTodayQueue", () => {
    it("should return today queue counts", async () => {
      repo.getTodayQueue.mockResolvedValue({
        queued: 5,
        inProgress: 3,
        completed: 2,
      });

      const result = await svc.getTodayQueue();

      expect(result.queued).toBe(5);
      expect(result.inProgress).toBe(3);
      expect(result.completed).toBe(2);
    });

    it("should return zero when no jobs today", async () => {
      repo.getTodayQueue.mockResolvedValue({
        queued: 0,
        inProgress: 0,
        completed: 0,
      });

      const result = await svc.getTodayQueue();

      expect(result.queued).toBe(0);
      expect(result.inProgress).toBe(0);
      expect(result.completed).toBe(0);
    });
  });
});
