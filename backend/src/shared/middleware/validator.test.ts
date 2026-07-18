/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { validate } from "./validator";

function mockReqRes() {
  const req = { body: {}, query: {}, params: {} } as unknown as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  const next = jest.fn() as NextFunction;
  return { req, res, next };
}

describe("validate middleware", () => {
  it("should call next() when schema is valid", () => {
    const schema = z.object({ name: z.string() });
    const middleware = validate(schema);

    const { req, res, next } = mockReqRes();
    req.body = { name: "test" };

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should send 400 when body is invalid", () => {
    const schema = z.object({ name: z.string().min(1) });
    const middleware = validate(schema);

    const { req, res, next } = mockReqRes();
    req.body = { name: "" };

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("should validate query params with custom source", () => {
    const schema = z.object({ page: z.coerce.number().int().min(1) });
    const middleware = validate(schema, "query");

    const { req, res, next } = mockReqRes();
    req.query = { page: "1" };

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.query).toEqual({ page: 1 });
  });

  it("should send 400 when query param is invalid", () => {
    const schema = z.object({ page: z.coerce.number().int().min(1) });
    const middleware = validate(schema, "query");

    const { req, res, next } = mockReqRes();
    req.query = { page: "abc" };

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("should validate params with custom source", () => {
    const schema = z.object({ id: z.string().min(1) });
    const middleware = validate(schema, "params");

    const { req, res, next } = mockReqRes();
    req.params = { id: "123" };

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.params).toEqual({ id: "123" });
  });

  it("should send 400 for non-Zod errors", () => {
    const schema = {
      parse: () => { throw new Error("random"); },
    } as any;
    const middleware = validate(schema);

    const { req, res, next } = mockReqRes();
    req.body = {};

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ code: 400, message: "Validation failed" });
    expect(next).not.toHaveBeenCalled();
  });
});
