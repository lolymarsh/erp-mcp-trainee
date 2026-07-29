/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from "express";
import { RegisterDashboardRoutes } from "./route";

describe("Dashboard routes", () => {
  it("should return a Router instance", () => {
    const handler = {
      GetSummary: jest.fn(),
    } as any;
    const auth = (() => jest.fn()) as any;
    const router = RegisterDashboardRoutes(handler, auth);
    expect(router).toBeInstanceOf(Router);
  });
});
