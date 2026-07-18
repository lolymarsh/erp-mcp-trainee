/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from "express";
import { registerJobRoutes } from "./route";

describe("Job routes", () => {
  it("should return a Router instance", () => {
    const handler = {
      filter: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      updateStatus: jest.fn(),
      todayQueue: jest.fn(),
    } as any;
    const auth = (() => jest.fn()) as any;
    const router = registerJobRoutes(handler, auth);
    expect(router).toBeInstanceOf(Router);
  });
});
