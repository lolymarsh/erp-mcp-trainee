/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from "express";
import { RegisterJobRoutes } from "./route";

describe("Job routes", () => {
  it("should return a Router instance", () => {
    const handler = {
      Filter: jest.fn(),
      GetById: jest.fn(),
      Create: jest.fn(),
      UpdateStatus: jest.fn(),
      TodayQueue: jest.fn(),
    } as any;
    const auth = (() => jest.fn()) as any;
    const router = RegisterJobRoutes(handler, auth);
    expect(router).toBeInstanceOf(Router);
  });
});
