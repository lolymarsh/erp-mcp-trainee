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
import type { IAuditLogService } from "../audit/service";
import { JobService } from "./service";
import type { IJobRepository } from "./repo";
import type { ICustomerRepository } from "../customer/repo";
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
  let customerRepo: jest.Mocked<ICustomerRepository>;
  let redis: jest.Mocked<Redis>;
  let svc: JobService;
  const mockAuditService = { Insert: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    repo = {
      FindFiltered: jest.fn(),
      FindById: jest.fn(),
      FindByIdWithLogs: jest.fn(),
      Create: jest.fn(),
      UpdateStatus: jest.fn(),
      GetTodayQueue: jest.fn(),
    };
    customerRepo = {
      FindFiltered: jest.fn(),
      FindById: jest.fn(),
      FindByIdWithVehicles: jest.fn(),
      FindByPhone: jest.fn(),
      Create: jest.fn(),
      Update: jest.fn(),
      SoftDelete: jest.fn(),
      FindVehicleById: jest.fn(),
      CreateVehicle: jest.fn(),
      UpdateVehicle: jest.fn(),
      DeleteVehicle: jest.fn(),
    };
    redis = { del: jest.fn() } as unknown as jest.Mocked<Redis>;
    svc = new JobService(repo, customerRepo, redis, mockAuditService as unknown as IAuditLogService);
  });

  describe("Filter", () => {
    it("should return paginated jobs", async () => {
      repo.FindFiltered.mockResolvedValue({
        data: [mockJob],
        total: 1,
      });

      const result = await svc.Filter({
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
      repo.FindFiltered.mockResolvedValue({ data: [], total: 0 });

      const result = await svc.Filter({
        page: 1,
        pageSize: 20,
        sortBy: "desc",
        filters: [],
      });

      expect(result.data).toHaveLength(0);
      expect(result.pagination.hasNextPage).toBe(false);
    });

    it("should filter by status", async () => {
      repo.FindFiltered.mockResolvedValue({
        data: [{ ...mockJob, status: "IN_PROGRESS" as const }],
        total: 1,
      });

      const result = await svc.Filter({
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

  describe("GetById", () => {
    it("should throw NotFoundError when job not found", async () => {
      repo.FindByIdWithLogs.mockResolvedValue(null);

      await expect(svc.GetById("nonexistent")).rejects.toThrow(
        NotFoundError,
      );
    });

    it("should return job with status logs", async () => {
      repo.FindByIdWithLogs.mockResolvedValue({
        job: mockJob,
        logs: [mockLog],
      });

      const result = await svc.GetById("job-1");

      expect(result.id).toBe("job-1");
      expect(result.status).toBe("QUEUED");
      expect(result.statusLogs).toHaveLength(1);
      expect(result.statusLogs[0].toStatus).toBe("IN_PROGRESS");
    });

    it("should return job with empty logs", async () => {
      repo.FindByIdWithLogs.mockResolvedValue({
        job: mockJob,
        logs: [],
      });

      const result = await svc.GetById("job-1");

      expect(result.statusLogs).toHaveLength(0);
    });
  });

  describe("UpdateStatus", () => {
    it("should throw NotFoundError when job not found", async () => {
      repo.FindById.mockResolvedValue(null);

      await expect(
        svc.UpdateStatus("nonexistent", {
          status: "IN_PROGRESS",
          version: 1,
        }, "user-1"),
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw BadRequestError when status same", async () => {
      repo.FindById.mockResolvedValue(mockJob);

      await expect(
        svc.UpdateStatus("job-1", {
          status: "QUEUED",
          version: 1,
        }, "user-1"),
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw BadRequestError for invalid transition", async () => {
      repo.FindById.mockResolvedValue({ ...mockJob, status: "COMPLETED" as const });

      await expect(
        svc.UpdateStatus("job-1", {
          status: "IN_PROGRESS",
          version: 1,
        }, "user-1"),
      ).rejects.toThrow(BadRequestError);
    });

    it("should allow QUEUED → IN_PROGRESS", async () => {
      repo.FindById.mockResolvedValue(mockJob);
      repo.UpdateStatus.mockResolvedValue({
        job: { ...mockJob, status: "IN_PROGRESS" as const, version: 2 },
        log: mockLog,
      });

      const result = await svc.UpdateStatus("job-1", {
        status: "IN_PROGRESS",
        version: 1,
      }, "user-1");

      expect(result.job.status).toBe("IN_PROGRESS");
      expect(result.job.version).toBe(2);
      expect(result.log.toStatus).toBe("IN_PROGRESS");
    });

    it("should allow QUEUED → CANCELLED", async () => {
      repo.FindById.mockResolvedValue(mockJob);
      repo.UpdateStatus.mockResolvedValue({
        job: { ...mockJob, status: "CANCELLED" as const, version: 2 },
        log: { ...mockLog, fromStatus: "QUEUED" as const, toStatus: "CANCELLED" as const },
      });

      const result = await svc.UpdateStatus("job-1", {
        status: "CANCELLED",
        version: 1,
      }, "user-1");

      expect(result.job.status).toBe("CANCELLED");
    });

    it("should allow IN_PROGRESS → COMPLETED", async () => {
      repo.FindById.mockResolvedValue({ ...mockJob, status: "IN_PROGRESS" as const });
      repo.UpdateStatus.mockResolvedValue({
        job: { ...mockJob, status: "COMPLETED" as const, version: 2 },
        log: { ...mockLog, fromStatus: "IN_PROGRESS" as const, toStatus: "COMPLETED" as const },
      });

      const result = await svc.UpdateStatus("job-1", {
        status: "COMPLETED",
        version: 1,
      }, "user-1");

      expect(result.job.status).toBe("COMPLETED");
    });

    it("should block COMPLETED → IN_PROGRESS", async () => {
      repo.FindById.mockResolvedValue({ ...mockJob, status: "COMPLETED" as const });

      await expect(
        svc.UpdateStatus("job-1", {
          status: "IN_PROGRESS",
          version: 1,
        }, "user-1"),
      ).rejects.toThrow(BadRequestError);
    });

    it("should block CANCELLED → any status", async () => {
      repo.FindById.mockResolvedValue({ ...mockJob, status: "CANCELLED" as const });

      await expect(
        svc.UpdateStatus("job-1", {
          status: "QUEUED",
          version: 1,
        }, "user-1"),
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("GetTodayQueue", () => {
    it("should return today queue counts", async () => {
      repo.GetTodayQueue.mockResolvedValue({
        queued: 5,
        inProgress: 3,
        completed: 2,
      });

      const result = await svc.GetTodayQueue();

      expect(result.queued).toBe(5);
      expect(result.inProgress).toBe(3);
      expect(result.completed).toBe(2);
    });

    it("should return zero when no jobs today", async () => {
      repo.GetTodayQueue.mockResolvedValue({
        queued: 0,
        inProgress: 0,
        completed: 0,
      });

      const result = await svc.GetTodayQueue();

      expect(result.queued).toBe(0);
      expect(result.inProgress).toBe(0);
      expect(result.completed).toBe(0);
    });
  });
});
