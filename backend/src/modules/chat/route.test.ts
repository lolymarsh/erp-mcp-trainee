/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from "express";
import { RegisterChatRoutes } from "./route";

describe("Chat routes", () => {
  it("should return a Router instance", () => {
    const handler = {
      SendMessage: jest.fn(),
      StreamMessage: jest.fn(),
      GetHistory: jest.fn(),
      ExportResult: jest.fn(),
      ListSessions: jest.fn(),
    } as any;
    const auth = (() => jest.fn()) as any;
    const router = RegisterChatRoutes(handler, auth);
    expect(router).toBeInstanceOf(Router);
  });
});
