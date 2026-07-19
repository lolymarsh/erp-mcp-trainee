/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from "express";
import { registerCustomerRoutes } from "./route";

describe("Customer routes", () => {
  it("should return a Router instance", () => {
    const handler = {
      filter: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      createVehicle: jest.fn(),
      updateVehicle: jest.fn(),
      deleteVehicle: jest.fn(),
    } as any;
    const auth = (() => jest.fn()) as any;
    const router = registerCustomerRoutes(handler, auth);
    expect(router).toBeInstanceOf(Router);
  });
});
