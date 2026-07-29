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
      Filter: jest.fn(),
      GetById: jest.fn(),
      Create: jest.fn(),
      UpdateStatus: jest.fn(),
      GetTodayQueue: jest.fn(),
    };
    handler = new JobHandler(svc);
  });

  describe("Filter", () => {
    it("should return 200 with data and pagination", async () => {
      svc.Filter.mockResolvedValue({ data: [mockJob], pagination: { page: 1, pageSize: 20, totalData: 1, totalPage: 1, hasNextPage: false, hasPreviousPage: false } });
      const { req, res } = mockReqRes();
      req.body = { page: 1, pageSize: 20, filters: [] };
      await handler.Filter(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("GetById", () => {
    it("should return 200 with job", async () => {
      svc.GetById.mockResolvedValue({ ...mockJob, statusLogs: [mockLog] });
      const { req, res } = mockReqRes();
      req.params = { id: "job-1" };
      await handler.GetById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should handle extractId with array params", async () => {
      svc.GetById.mockResolvedValue({ ...mockJob, statusLogs: [mockLog] });
      const { req, res } = mockReqRes();
      req.params = { id: ["job-1", "job-2"] } as unknown as Record<string, string>;
      await handler.GetById(req, res);
      expect(svc.GetById).toHaveBeenCalledWith("job-1");
    });
  });

  describe("Create", () => {
    it("should return 201 on success", async () => {
      svc.Create.mockResolvedValue({ ...mockJob, statusLogs: [] });
      const { req, res } = mockReqRes();
      req.body = { customerId: "cust-1", vehicleId: "veh-1", jobType: "INSTALL" };
      await handler.Create(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("UpdateStatus", () => {
    it("should return 200 on success", async () => {
      svc.UpdateStatus.mockResolvedValue({ job: { ...mockJob, status: "IN_PROGRESS", version: 2 }, log: mockLog });
      const { req, res } = mockReqRes();
      req.params = { id: "job-1" };
      req.body = { status: "IN_PROGRESS", version: 1 };
      req.user = { userId: "user-1", role: "ADMIN" };
      await handler.UpdateStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should use system when no req.user", async () => {
      svc.UpdateStatus.mockResolvedValue({ job: { ...mockJob, status: "IN_PROGRESS", version: 2 }, log: mockLog });
      const { req, res } = mockReqRes();
      req.params = { id: "job-1" };
      req.body = { status: "IN_PROGRESS", version: 1 };
      await handler.UpdateStatus(req, res);
      expect(svc.UpdateStatus).toHaveBeenCalledWith("job-1", expect.any(Object), "system", undefined);
    });

    it("should return 409 on version mismatch", async () => {
      svc.UpdateStatus.mockRejectedValue(new Error("VERSION_MISMATCH"));
      const { req, res } = mockReqRes();
      req.params = { id: "job-1" };
      req.body = { status: "IN_PROGRESS", version: 1 };
      await handler.UpdateStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it("should return 404 when job not found", async () => {
      svc.UpdateStatus.mockRejectedValue(new Error("JOB_NOT_FOUND"));
      const { req, res } = mockReqRes();
      req.params = { id: "nonexistent" };
      req.body = { status: "IN_PROGRESS", version: 1 };
      await handler.UpdateStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("TodayQueue", () => {
    it("should return 200 with queue data", async () => {
      svc.GetTodayQueue.mockResolvedValue({ queued: 5, inProgress: 3, completed: 2 });
      const { req, res } = mockReqRes();
      await handler.TodayQueue(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("error cases", () => {
    it("should handle AppError", async () => {
      svc.GetById.mockRejectedValue(new AppError(404, "Job not found"));
      const { req, res } = mockReqRes();
      req.params = { id: "nonexistent" };
      await handler.GetById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should handle ZodError", async () => {
      const { req, res } = mockReqRes();
      req.body = {};
      await handler.Create(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should handle 500 on unexpected error in TodayQueue", async () => {
      svc.GetTodayQueue.mockRejectedValue(new Error("unexpected"));
      const { req, res } = mockReqRes();
      await handler.TodayQueue(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("should handle AppError in Filter", async () => {
      svc.Filter.mockRejectedValue(new AppError(400, "Invalid filter"));
      const { req, res } = mockReqRes();
      req.body = { page: 1, pageSize: 20 };
      await handler.Filter(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should handle ZodError in Filter", async () => {
      const { req, res } = mockReqRes();
      req.body = { page: "abc" };
      await handler.Filter(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should handle 500 in Filter", async () => {
      svc.Filter.mockRejectedValue(new Error("unexpected"));
      const { req, res } = mockReqRes();
      req.body = { page: 1, pageSize: 20, filters: [] };
      await handler.Filter(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("should handle 500 in GetById", async () => {
      svc.GetById.mockRejectedValue(new Error("unexpected"));
      const { req, res } = mockReqRes();
      req.params = { id: "job-1" };
      await handler.GetById(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("should handle AppError in Create", async () => {
      svc.Create.mockRejectedValue(new AppError(400, "Invalid job data"));
      const { req, res } = mockReqRes();
      req.body = { customerId: "cust-1", vehicleId: "veh-1", jobType: "INSTALL" };
      await handler.Create(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should handle 500 in Create", async () => {
      svc.Create.mockRejectedValue(new Error("unexpected"));
      const { req, res } = mockReqRes();
      req.body = { customerId: "cust-1", vehicleId: "veh-1", jobType: "INSTALL" };
      await handler.Create(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("should handle AppError in UpdateStatus", async () => {
      svc.UpdateStatus.mockRejectedValue(new AppError(403, "Forbidden"));
      const { req, res } = mockReqRes();
      req.params = { id: "job-1" };
      req.body = { status: "IN_PROGRESS", version: 1 };
      await handler.UpdateStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("should handle ZodError in UpdateStatus", async () => {
      const { req, res } = mockReqRes();
      req.params = { id: "job-1" };
      req.body = { status: "INVALID" };
      await handler.UpdateStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should handle 500 in UpdateStatus", async () => {
      svc.UpdateStatus.mockRejectedValue(new Error("unexpected"));
      const { req, res } = mockReqRes();
      req.params = { id: "job-1" };
      req.body = { status: "IN_PROGRESS", version: 1 };
      await handler.UpdateStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("should handle AppError in TodayQueue", async () => {
      svc.GetTodayQueue.mockRejectedValue(new AppError(500, "DB error"));
      const { req, res } = mockReqRes();
      await handler.TodayQueue(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
