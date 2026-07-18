import { calculatePagination, sendSuccess, sendError } from "./handler";
import type { Response } from "express";

function mockRes(): Response {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

describe("calculatePagination", () => {
  it("should calculate page 1 of 5 with 100 total", () => {
    const result = calculatePagination(1, 20, 100);
    expect(result).toEqual({
      page: 1,
      pageSize: 20,
      totalData: 100,
      totalPage: 5,
      hasNextPage: true,
      hasPreviousPage: false,
    });
  });

  it("should calculate last page", () => {
    const result = calculatePagination(5, 20, 100);
    expect(result.hasNextPage).toBe(false);
    expect(result.hasPreviousPage).toBe(true);
    expect(result.totalPage).toBe(5);
  });

  it("should handle single page", () => {
    const result = calculatePagination(1, 20, 5);
    expect(result.totalPage).toBe(1);
    expect(result.hasNextPage).toBe(false);
    expect(result.hasPreviousPage).toBe(false);
  });

  it("should handle partial last page", () => {
    const result = calculatePagination(1, 20, 25);
    expect(result.totalPage).toBe(2);
    expect(result.hasNextPage).toBe(true);
    expect(result.hasPreviousPage).toBe(false);
  });

  it("should handle zero data", () => {
    const result = calculatePagination(1, 20, 0);
    expect(result.totalData).toBe(0);
    expect(result.totalPage).toBe(0);
    expect(result.hasNextPage).toBe(false);
    expect(result.hasPreviousPage).toBe(false);
  });
});

describe("sendSuccess", () => {
  it("should send response with data only", () => {
    const res = mockRes();
    sendSuccess(res, 200, "success", { data: { id: "1" } });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ code: 200, message: "success", data: { id: "1" } });
  });

  it("should send response with data and pagination", () => {
    const res = mockRes();
    const pagination = { page: 1, pageSize: 20, totalData: 1, totalPage: 1, hasNextPage: false, hasPreviousPage: false };
    sendSuccess(res, 200, "success", { data: [{ id: "1" }], pagination });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ code: 200, message: "success", data: [{ id: "1" }], pagination });
  });

  it("should send response without payload", () => {
    const res = mockRes();
    sendSuccess(res, 204, "no content");
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.json).toHaveBeenCalledWith({ code: 204, message: "no content" });
  });
});

describe("sendError", () => {
  it("should send error with details", () => {
    const res = mockRes();
    sendError(res, 400, "Validation error", { field: "name" });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ code: 400, message: "Validation error", details: { field: "name" } });
  });

  it("should send error without details", () => {
    const res = mockRes();
    sendError(res, 500, "Internal server error");
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ code: 500, message: "Internal server error" });
  });
});
