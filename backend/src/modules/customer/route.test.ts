/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from "express";
import { RegisterCustomerRoutes } from "./route";

describe("Customer routes", () => {
  it("should return a Router instance", () => {
    const handler = {
      Filter: jest.fn(),
      GetById: jest.fn(),
      Create: jest.fn(),
      Update: jest.fn(),
      SoftDelete: jest.fn(),
      CreateVehicle: jest.fn(),
      UpdateVehicle: jest.fn(),
      DeleteVehicle: jest.fn(),
    } as any;
    const auth = (() => jest.fn()) as any;
    const router = RegisterCustomerRoutes(handler, auth);
    expect(router).toBeInstanceOf(Router);
  });
});
