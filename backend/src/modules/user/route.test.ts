/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from "express";
import { RegisterUserRoutes } from "./route";

describe("User routes", () => {
  it("should return a Router instance", () => {
    const handler = {
      Login: jest.fn(),
      GetProfile: jest.fn(),
      CreateUser: jest.fn(),
      Filter: jest.fn(),
      Update: jest.fn(),
      SoftDelete: jest.fn(),
      Deactivate: jest.fn(),
    } as any;
    const auth = (() => jest.fn()) as any;
    const router = RegisterUserRoutes(handler, auth);
    expect(router).toBeInstanceOf(Router);
  });
});
