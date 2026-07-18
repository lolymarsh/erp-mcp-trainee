/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from "express";
import { registerChatRoutes } from "./route";

describe("Chat routes", () => {
  it("should return a Router instance", () => {
    const handler = {
      sendMessage: jest.fn(),
      streamMessage: jest.fn(),
      getHistory: jest.fn(),
      exportResult: jest.fn(),
    } as any;
    const auth = (() => jest.fn()) as any;
    const router = registerChatRoutes(handler, auth);
    expect(router).toBeInstanceOf(Router);
  });
});
