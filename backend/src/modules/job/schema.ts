import { z } from "zod";

export const createJobSchema = z.object({
  customerId: z.string().min(1).max(36),
  vehicleId: z.string().min(1).max(36),
  invoiceId: z.string().min(1).max(36).optional().nullable(),
  jobType: z.enum(["INSTALL", "REPAIR", "INSPECT"]),
  scheduledDate: z.string().datetime().optional().nullable(),
  technicianId: z.string().min(1).max(36).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateJobStatusSchema = z.object({
  status: z.enum(["QUEUED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  note: z.string().optional().nullable(),
  version: z.number().int().min(1),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobStatusInput = z.infer<typeof updateJobStatusSchema>;

export interface JobResponse {
  id: string;
  customerId: string;
  vehicleId: string;
  invoiceId: string | null;
  jobType: "INSTALL" | "REPAIR" | "INSPECT";
  status: "QUEUED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  scheduledDate: string | null;
  startTime: string | null;
  endTime: string | null;
  technicianId: string | null;
  notes: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobStatusLogResponse {
  id: string;
  jobId: string;
  fromStatus: string | null;
  toStatus: string;
  changedBy: string;
  note: string | null;
  createdAt: string;
}

export interface JobWithLogsResponse extends JobResponse {
  statusLogs: JobStatusLogResponse[];
}

export interface TodayQueueResponse {
  queued: number;
  inProgress: number;
  completed: number;
}
