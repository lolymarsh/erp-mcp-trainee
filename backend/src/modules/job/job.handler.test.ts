import type { Request, Response } from "express";
import { JobHandler } from "./handler";
import type { IJobService } from "./service";
import { AppError } from "../../shared/errors/AppError";

function mockReqRes() {
  const req = { body: {}, params: {}, user: undefined } as unknown as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return { req, res };
}

const mockJob = {
  id: "job-1",
  customerId: "cust-1",
  vehicleId: "veh-1",
  invoiceId: null,
  jobType: "INSTALL" as const,
  status: "QUEUED" as const,
  scheduledDate: null,
  startTime: null,
  endTime: null,
  technicianId: null,
  notes: null,
  version: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const mockLog = {
  id: "log-1",
  jobId: "job-1",
  fromStatus: "QUEUED",
  toStatus: "IN_PROGRESS",
  changedBy: "user-1",
  note: null,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("JobHandler", () => {
  let svc: jest.Mocked<IJobService>;
  let handler: JobHandler;

  beforeEach(() => {
    svc = {
      filter: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      updateStatus: jest.fn(),
      getTodayQueue: jest.fn(),
    };
    handler = new JobHandler(svc);
  });

  describe("filter", () => {
    it("should return 200 with data and pagination", async () => {
      svc.filter.mockResolvedValue({ data: [mockJob], pagination: { page: 1, pageSize: 20, totalData: 1, totalPage: 1, hasNextPage: false, hasPreviousPage: false } });
      const { req, res } = mockReqRes();
      req.body = { page: 1, pageSize: 20, filters: [] };
      await handler.filter(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getById", () => {
    it("should return 200 with job", async () => {
      svc.getById.mockResolvedValue({ ...mockJob, statusLogs: [mockLog] });
      const { req, res } = mockReqRes();
      req.params = { id: "job-1" };
      await handler.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should handle extractId with array params", async () => {
      svc.getById.mockResolvedValue({ ...mockJob, statusLogs: [mockLog] });
      const { req, res } = mockReqRes();
      req.params = { id: ["job-1", "job-2"] } as unknown as Record<string, string>;
      await handler.getById(req, res);
      expect(svc.getById).toHaveBeenCalledWith("job-1");
    });
  });

  describe("create", () => {
    it("should return 201 on success", async () => {
      svc.create.mockResolvedValue({ ...mockJob, statusLogs: [] });
      const { req, res } = mockReqRes();
      req.body = { customerId: "cust-1", vehicleId: "veh-1", jobType: "INSTALL" };
      await handler.create(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("updateStatus", () => {
    it("should return 200 on success", async () => {
      svc.updateStatus.mockResolvedValue({ job: { ...mockJob, status: "IN_PROGRESS", version: 2 }, log: mockLog });
      const { req, res } = mockReqRes();
      req.params = { id: "job-1" };
      req.body = { status: "IN_PROGRESS", version: 1 };
      req.user = { userId: "user-1", role: "ADMIN" };
      await handler.updateStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should use system when no req.user", async () => {
      svc.updateStatus.mockResolvedValue({ job: { ...mockJob, status: "IN_PROGRESS", version: 2 }, log: mockLog });
      const { req, res } = mockReqRes();
      req.params = { id: "job-1" };
      req.body = { status: "IN_PROGRESS", version: 1 };
      await handler.updateStatus(req, res);
      expect(svc.updateStatus).toHaveBeenCalledWith("job-1", expect.any(Object), "system");
    });

    it("should return 409 on version mismatch", async () => {
      svc.updateStatus.mockRejectedValue(new Error("VERSION_MISMATCH"));
      const { req, res } = mockReqRes();
      req.params = { id: "job-1" };
      req.body = { status: "IN_PROGRESS", version: 1 };
      await handler.updateStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it("should return 404 when job not found", async () => {
      svc.updateStatus.mockRejectedValue(new Error("JOB_NOT_FOUND"));
      const { req, res } = mockReqRes();
      req.params = { id: "nonexistent" };
      req.body = { status: "IN_PROGRESS", version: 1 };
      await handler.updateStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("todayQueue", () => {
    it("should return 200 with queue data", async () => {
      svc.getTodayQueue.mockResolvedValue({ queued: 5, inProgress: 3, completed: 2 });
      const { req, res } = mockReqRes();
      await handler.todayQueue(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("error cases", () => {
    it("should handle AppError", async () => {
      svc.getById.mockRejectedValue(new AppError(404, "Job not found"));
      const { req, res } = mockReqRes();
      req.params = { id: "nonexistent" };
      await handler.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should handle ZodError", async () => {
      const { req, res } = mockReqRes();
      req.body = {};
      await handler.create(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should handle 500 on unexpected error in todayQueue", async () => {
      svc.getTodayQueue.mockRejectedValue(new Error("unexpected"));
      const { req, res } = mockReqRes();
      await handler.todayQueue(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("should handle AppError in filter", async () => {
      svc.filter.mockRejectedValue(new AppError(400, "Invalid filter"));
      const { req, res } = mockReqRes();
      req.body = { page: 1, pageSize: 20 };
      await handler.filter(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should handle ZodError in filter", async () => {
      const { req, res } = mockReqRes();
      req.body = { page: "abc" };
      await handler.filter(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should handle 500 in filter", async () => {
      svc.filter.mockRejectedValue(new Error("unexpected"));
      const { req, res } = mockReqRes();
      req.body = { page: 1, pageSize: 20, filters: [] };
      await handler.filter(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("should handle 500 in getById", async () => {
      svc.getById.mockRejectedValue(new Error("unexpected"));
      const { req, res } = mockReqRes();
      req.params = { id: "job-1" };
      await handler.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("should handle AppError in create", async () => {
      svc.create.mockRejectedValue(new AppError(400, "Invalid job data"));
      const { req, res } = mockReqRes();
      req.body = { customerId: "cust-1", vehicleId: "veh-1", jobType: "INSTALL" };
      await handler.create(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should handle 500 in create", async () => {
      svc.create.mockRejectedValue(new Error("unexpected"));
      const { req, res } = mockReqRes();
      req.body = { customerId: "cust-1", vehicleId: "veh-1", jobType: "INSTALL" };
      await handler.create(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("should handle AppError in updateStatus", async () => {
      svc.updateStatus.mockRejectedValue(new AppError(403, "Forbidden"));
      const { req, res } = mockReqRes();
      req.params = { id: "job-1" };
      req.body = { status: "IN_PROGRESS", version: 1 };
      await handler.updateStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("should handle ZodError in updateStatus", async () => {
      const { req, res } = mockReqRes();
      req.params = { id: "job-1" };
      req.body = { status: "INVALID" };
      await handler.updateStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should handle 500 in updateStatus", async () => {
      svc.updateStatus.mockRejectedValue(new Error("unexpected"));
      const { req, res } = mockReqRes();
      req.params = { id: "job-1" };
      req.body = { status: "IN_PROGRESS", version: 1 };
      await handler.updateStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("should handle AppError in todayQueue", async () => {
      svc.getTodayQueue.mockRejectedValue(new AppError(500, "DB error"));
      const { req, res } = mockReqRes();
      await handler.todayQueue(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
