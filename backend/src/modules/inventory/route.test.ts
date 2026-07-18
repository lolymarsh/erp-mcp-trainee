/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from "express";
import { registerInventoryRoutes } from "./route";

describe("Inventory routes", () => {
  it("should return a Router instance", () => {
    const handler = {
      filter: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      adjustStock: jest.fn(),
      listCategories: jest.fn(),
    } as any;
    const auth = (() => jest.fn()) as any;
    const router = registerInventoryRoutes(handler, auth);
    expect(router).toBeInstanceOf(Router);
  });
});
