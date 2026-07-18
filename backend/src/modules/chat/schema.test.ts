import { sendMessageSchema } from "./schema";

describe("Chat schemas", () => {
  describe("sendMessageSchema", () => {
    it("should accept valid input with default format", () => {
      const result = sendMessageSchema.parse({ question: "ยอดขายวันนี้" });
      expect(result.question).toBe("ยอดขายวันนี้");
      expect(result.format).toBe("text");
    });

    it("should accept all valid formats", () => {
      const formats = ["text", "table", "csv", "html", "json"] as const;
      for (const f of formats) {
        const result = sendMessageSchema.parse({ question: "test", format: f });
        expect(result.format).toBe(f);
      }
    });

    it("should reject empty question", () => {
      expect(() => sendMessageSchema.parse({ question: "" })).toThrow();
    });

    it("should reject question longer than 2000 chars", () => {
      expect(() =>
        sendMessageSchema.parse({ question: "x".repeat(2001) }),
      ).toThrow();
    });

    it("should reject invalid format", () => {
      expect(() =>
        sendMessageSchema.parse({ question: "test", format: "invalid" }),
      ).toThrow();
    });
  });
});
