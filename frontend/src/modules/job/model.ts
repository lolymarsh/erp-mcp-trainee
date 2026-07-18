import { api } from "../../config/api";

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

export interface CreateJobInput {
  customerId: string;
  vehicleId: string;
  invoiceId?: string | null;
  jobType: "INSTALL" | "REPAIR" | "INSPECT";
  scheduledDate?: string | null;
  technicianId?: string | null;
  notes?: string | null;
}

export interface UpdateJobStatusInput {
  status: "QUEUED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  note?: string | null;
  version: number;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalData: number;
  totalPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedJobs {
  data: JobResponse[];
  pagination: PaginationInfo;
}

export interface FilterRequest {
  page: number;
  pageSize: number;
  sortName?: string;
  sortBy?: "asc" | "desc";
  filters?: { field: string; operator: string; value: unknown }[];
}

export const jobApi = {
  filter: async (input: FilterRequest): Promise<PaginatedJobs> => {
    const { data } = await api.post("/jobs/filter", input);
    return { data: data.data, pagination: data.pagination };
  },

  getById: async (id: string): Promise<JobWithLogsResponse> => {
    const { data } = await api.get(`/jobs/${id}`);
    return data.data;
  },

  create: async (input: CreateJobInput): Promise<JobWithLogsResponse> => {
    const { data } = await api.post("/jobs", input);
    return data.data;
  },

  updateStatus: async (
    id: string,
    input: UpdateJobStatusInput,
  ): Promise<{ job: JobResponse; log: JobStatusLogResponse }> => {
    const { data } = await api.patch(`/jobs/${id}/status`, input);
    return data.data;
  },

  getTodayQueue: async (): Promise<TodayQueueResponse> => {
    const { data } = await api.get("/jobs/today-queue");
    return data.data;
  },
};
