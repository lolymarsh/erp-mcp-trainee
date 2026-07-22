import type { Request, Response } from "express";
import { ChatHandler } from "./handler";
import type { IChatService } from "./service";
import { AppError } from "../../shared/errors/AppError";

function mockReqRes() {
  const req = { body: {}, params: {}, headers: {}, query: {}, user: undefined } as unknown as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    write: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    flushHeaders: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return { req, res };
}

const mockChatResponse = {
  question: "ยอดขายวันนี้",
  sql: "SELECT SUM(grand_total) FROM invoices WHERE DATE(created_at) = CURDATE()",
  resultCount: 1,
  data: [{ total: "85000" }],
  formatted: "total: 85000",
  format: "text",
};

describe("ChatHandler", () => {
  let svc: jest.Mocked<IChatService>;
  let handler: ChatHandler;

  beforeEach(() => {
    svc = {
      ask: jest.fn(),
      getHistory: jest.fn(),
      listSessions: jest.fn(),
      executeHeavyQuery: jest.fn(),
    };
    handler = new ChatHandler(svc);
  });

  describe("sendMessage", () => {
    it("should return 200 on success", async () => {
      svc.ask.mockResolvedValue(mockChatResponse);
      const { req, res } = mockReqRes();
      req.body = { question: "ยอดขายวันนี้", format: "text" };
      req.headers["x-session-id"] = "session-1";
      req.user = { userId: "user-1", role: "ADMIN" };

      await handler.sendMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        code: 200,
        message: "success",
        data: mockChatResponse,
      });
    });

    it("should use anonymous when no req.user", async () => {
      svc.ask.mockResolvedValue(mockChatResponse);
      const { req, res } = mockReqRes();
      req.body = { question: "ยอดขายวันนี้" };

      await handler.sendMessage(req, res);

      expect(svc.ask).toHaveBeenCalledWith(expect.any(Object), "anonymous", "default");
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 400 on ZodError", async () => {
      const { req, res } = mockReqRes();
      req.body = {};

      await handler.sendMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should handle AppError", async () => {
      svc.ask.mockRejectedValue(new AppError(500, "Chat error"));
      const { req, res } = mockReqRes();
      req.body = { question: "test" };

      await handler.sendMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("should handle unexpected error as 500", async () => {
      svc.ask.mockRejectedValue(new Error("unexpected"));
      const { req, res } = mockReqRes();
      req.body = { question: "test" };

      await handler.sendMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getHistory", () => {
    it("should return 200 with history", async () => {
      const history = [{ _id: "msg-1", sessionId: "s1", userId: "u1", question: "test", sql: "SELECT 1", resultCount: 1, format: "text", response: "1", cached: false, createdAt: new Date() }];
      svc.getHistory.mockResolvedValue(history);
      const { req, res } = mockReqRes();
      req.headers["x-session-id"] = "session-1";

      await handler.getHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(svc.getHistory).toHaveBeenCalledWith("session-1", 50);
    });

    it("should use custom limit from query", async () => {
      svc.getHistory.mockResolvedValue([]);
      const { req, res } = mockReqRes();
      req.headers["x-session-id"] = "session-1";
      req.query = { limit: "10" };

      await handler.getHistory(req, res);

      expect(svc.getHistory).toHaveBeenCalledWith("session-1", 10);
    });

    it("should handle AppError", async () => {
      svc.getHistory.mockRejectedValue(new AppError(400, "Bad request"));
      const { req, res } = mockReqRes();

      await handler.getHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should handle unexpected error as 500", async () => {
      svc.getHistory.mockRejectedValue(new Error("unexpected"));
      const { req, res } = mockReqRes();

      await handler.getHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("exportResult", () => {
    it("should return file with correct headers", async () => {
      svc.ask.mockResolvedValue(mockChatResponse);
      const { req, res } = mockReqRes();
      req.body = { question: "ยอดขายวันนี้", format: "csv" };

      await handler.exportResult(req, res);

      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/csv");
      expect(res.setHeader).toHaveBeenCalledWith(
        "Content-Disposition",
        expect.stringContaining("attachment"),
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 400 on ZodError", async () => {
      const { req, res } = mockReqRes();
      req.body = {};

      await handler.exportResult(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should handle AppError", async () => {
      svc.ask.mockRejectedValue(new AppError(500, "Export error"));
      const { req, res } = mockReqRes();
      req.body = { question: "test", format: "json" };

      await handler.exportResult(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
