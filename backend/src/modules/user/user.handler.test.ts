import type { Request, Response } from "express";
import { UserHandler } from "./handler";
import type { IUserService } from "./service";
import { AppError } from "../../shared/errors/AppError";

function mockReqRes() {
  const req = { body: {}, params: {}, user: undefined } as unknown as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return { req, res };
}

describe("UserHandler", () => {
  let svc: jest.Mocked<IUserService>;
  let handler: UserHandler;

  beforeEach(() => {
    svc = {
      Login: jest.fn(),
      GetProfile: jest.fn(),
      CreateUser: jest.fn(),
      Filter: jest.fn(),
      Update: jest.fn(),
      SoftDelete: jest.fn(),
      Deactivate: jest.fn(),
    };
    handler = new UserHandler(svc);
  });

  describe("Login", () => {
    it("should return 200 on success", async () => {
      svc.Login.mockResolvedValue({ token: "t1", user: { id: "u1", username: "admin", displayName: "Admin", role: "ADMIN", isActive: true, version: 1, createdAt: "2026-01-01" } });
      const { req, res } = mockReqRes();
      req.body = { username: "admin", password: "pass" };
      await handler.Login(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ code: 200, message: "success", data: expect.any(Object) });
    });

    it("should return 401 on invalid credentials", async () => {
      svc.Login.mockRejectedValue(new AppError(401, "Invalid credentials"));
      const { req, res } = mockReqRes();
      req.body = { username: "admin", password: "wrong" };
      await handler.Login(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should return 400 on validation error", async () => {
      const { req, res } = mockReqRes();
      req.body = {};
      await handler.Login(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 500 on unexpected error", async () => {
      svc.Login.mockRejectedValue(new Error("boom"));
      const { req, res } = mockReqRes();
      req.body = { username: "admin", password: "pass" };
      await handler.Login(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("GetProfile", () => {
    it("should return 200 on success", async () => {
      svc.GetProfile.mockResolvedValue({ id: "u1", username: "admin", displayName: "Admin", role: "ADMIN", isActive: true, version: 1, createdAt: "2026-01-01" });
      const { req, res } = mockReqRes();
      req.user = { userId: "u1", role: "ADMIN" };
      await handler.GetProfile(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 404 when user not found", async () => {
      svc.GetProfile.mockRejectedValue(new AppError(404, "User not found"));
      const { req, res } = mockReqRes();
      req.user = { userId: "u1", role: "ADMIN" };
      await handler.GetProfile(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should return 500 on unexpected error", async () => {
      svc.GetProfile.mockRejectedValue(new Error("unexpected"));
      const { req, res } = mockReqRes();
      req.user = { userId: "u1", role: "ADMIN" };
      await handler.GetProfile(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("CreateUser", () => {
    it("should return 201 on success", async () => {
      svc.CreateUser.mockResolvedValue({ id: "u2", username: "newuser", displayName: "New", role: "STAFF", isActive: true, version: 1, createdAt: "2026-01-01" });
      const { req, res } = mockReqRes();
      req.body = { username: "newuser", password: "pass123", displayName: "New", role: "STAFF" };
      await handler.CreateUser(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should return 409 on duplicate username", async () => {
      svc.CreateUser.mockRejectedValue(new AppError(409, "Username already exists"));
      const { req, res } = mockReqRes();
      req.body = { username: "admin", password: "pass123", displayName: "Admin", role: "ADMIN" };
      await handler.CreateUser(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it("should return 400 on validation error", async () => {
      const { req, res } = mockReqRes();
      req.body = {};
      await handler.CreateUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 500 on unexpected error", async () => {
      svc.CreateUser.mockRejectedValue(new Error("unexpected"));
      const { req, res } = mockReqRes();
      req.body = { username: "newuser", password: "pass123", displayName: "New", role: "STAFF" };
      await handler.CreateUser(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
