/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from "express";
import { registerDashboardRoutes } from "./route";

describe("Dashboard routes", () => {
  it("should return a Router instance", () => {
    const handler = {
      getSummary: jest.fn(),
    } as any;
    const auth = (() => jest.fn()) as any;
    const router = registerDashboardRoutes(handler, auth);
    expect(router).toBeInstanceOf(Router);
  });
});
