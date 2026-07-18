import { createJobSchema, updateJobStatusSchema } from "./schema";

describe("Job schemas", () => {
  describe("createJobSchema", () => {
    it("should accept valid input", () => {
      const result = createJobSchema.parse({
        customerId: "cust-1",
        vehicleId: "veh-1",
        jobType: "INSTALL",
      });
      expect(result.jobType).toBe("INSTALL");
      expect(result.scheduledDate).toBeUndefined();
      expect(result.notes).toBeUndefined();
    });

    it("should accept input with all fields", () => {
      const result = createJobSchema.parse({
        customerId: "cust-1",
        vehicleId: "veh-1",
        invoiceId: "inv-1",
        jobType: "REPAIR",
        scheduledDate: "2026-07-20T00:00:00.000Z",
        technicianId: "tech-1",
        notes: "Fix the gas system",
      });
      expect(result.jobType).toBe("REPAIR");
      expect(result.scheduledDate).toBe("2026-07-20T00:00:00.000Z");
      expect(result.notes).toBe("Fix the gas system");
    });

    it("should reject missing customerId", () => {
      expect(() =>
        createJobSchema.parse({ vehicleId: "veh-1", jobType: "INSTALL" }),
      ).toThrow();
    });

    it("should reject missing vehicleId", () => {
      expect(() =>
        createJobSchema.parse({ customerId: "cust-1", jobType: "INSTALL" }),
      ).toThrow();
    });

    it("should reject invalid jobType", () => {
      expect(() =>
        createJobSchema.parse({
          customerId: "cust-1",
          vehicleId: "veh-1",
          jobType: "INVALID",
        }),
      ).toThrow();
    });

    it("should accept null invoiceId, scheduledDate, technicianId, notes", () => {
      const result = createJobSchema.parse({
        customerId: "cust-1",
        vehicleId: "veh-1",
        jobType: "INSTALL",
        invoiceId: null,
        scheduledDate: null,
        technicianId: null,
        notes: null,
      });
      expect(result.invoiceId).toBeNull();
      expect(result.scheduledDate).toBeNull();
      expect(result.technicianId).toBeNull();
      expect(result.notes).toBeNull();
    });
  });

  describe("updateJobStatusSchema", () => {
    it("should accept valid input with version", () => {
      const result = updateJobStatusSchema.parse({
        status: "IN_PROGRESS",
        version: 1,
      });
      expect(result.status).toBe("IN_PROGRESS");
      expect(result.version).toBe(1);
    });

    it("should accept input with note", () => {
      const result = updateJobStatusSchema.parse({
        status: "CANCELLED",
        version: 1,
        note: "Customer cancelled",
      });
      expect(result.note).toBe("Customer cancelled");
    });

    it("should reject version = 0", () => {
      expect(() =>
        updateJobStatusSchema.parse({ status: "IN_PROGRESS", version: 0 }),
      ).toThrow();
    });

    it("should reject missing version", () => {
      expect(() =>
        updateJobStatusSchema.parse({ status: "IN_PROGRESS" }),
      ).toThrow();
    });

    it("should reject invalid status", () => {
      expect(() =>
        updateJobStatusSchema.parse({ status: "INVALID", version: 1 }),
      ).toThrow();
    });

    it("should accept null note", () => {
      const result = updateJobStatusSchema.parse({
        status: "COMPLETED",
        version: 1,
        note: null,
      });
      expect(result.note).toBeNull();
    });
  });
});
