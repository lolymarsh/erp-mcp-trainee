/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from "express";
import { registerUserRoutes } from "./route";

describe("User routes", () => {
  it("should return a Router instance", () => {
    const handler = {
      login: jest.fn(),
      getProfile: jest.fn(),
      createUser: jest.fn(),
      filter: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      deactivate: jest.fn(),
    } as any;
    const auth = (() => jest.fn()) as any;
    const router = registerUserRoutes(handler, auth);
    expect(router).toBeInstanceOf(Router);
  });
});
