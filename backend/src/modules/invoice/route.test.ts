/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from "express";
import { RegisterInvoiceRoutes } from "./route";

describe("Invoice routes", () => {
  it("should return a Router instance", () => {
    const handler = {
      Filter: jest.fn(),
      GetById: jest.fn(),
      Create: jest.fn(),
      TodaySummary: jest.fn(),
      UpdatePaymentStatus: jest.fn(),
    } as any;
    const auth = (() => jest.fn()) as any;
    const router = RegisterInvoiceRoutes(handler, auth);
    expect(router).toBeInstanceOf(Router);
  });
});
