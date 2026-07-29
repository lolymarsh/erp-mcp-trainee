/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from "express";
import { RegisterInventoryRoutes } from "./route";

describe("Inventory routes", () => {
  it("should return a Router instance", () => {
    const handler = {
      Filter: jest.fn(),
      GetById: jest.fn(),
      Create: jest.fn(),
      Update: jest.fn(),
      SoftDelete: jest.fn(),
      AdjustStock: jest.fn(),
      FilterCategories: jest.fn(),
      ListCategories: jest.fn(),
      CreateCategory: jest.fn(),
      UpdateCategory: jest.fn(),
      DeleteCategory: jest.fn(),
    } as any;
    const auth = (() => jest.fn()) as any;
    const router = RegisterInventoryRoutes(handler, auth);
    expect(router).toBeInstanceOf(Router);
  });
});
