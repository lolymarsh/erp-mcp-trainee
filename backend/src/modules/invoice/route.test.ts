/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from "express";
import { registerInvoiceRoutes } from "./route";

describe("Invoice routes", () => {
  it("should return a Router instance", () => {
    const handler = {
      filter: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      todaySummary: jest.fn(),
    } as any;
    const auth = (() => jest.fn()) as any;
    const router = registerInvoiceRoutes(handler, auth);
    expect(router).toBeInstanceOf(Router);
  });
});
