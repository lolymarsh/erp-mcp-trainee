export type JobStatus = "QUEUED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type JobType = "INSTALL" | "REPAIR" | "INSPECT";

export interface JobEntity {
  id: string;
  customerId: string;
  vehicleId: string;
  invoiceId: string | null;
  jobType: JobType;
  status: JobStatus;
  scheduledDate: Date | null;
  startTime: Date | null;
  endTime: Date | null;
  technicianId: string | null;
  notes: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobStatusLogEntity {
  id: string;
  jobId: string;
  fromStatus: JobStatus | null;
  toStatus: JobStatus;
  changedBy: string;
  note: string | null;
  createdAt: Date;
}
