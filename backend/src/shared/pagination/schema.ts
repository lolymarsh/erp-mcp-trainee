import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const sortSchema = z.object({
  sortName: z.string().optional(),
  sortBy: z.enum(['asc', 'desc']).default('desc'),
});

export interface FilterRequest {
  field: string;
  operator: 'eq' | 'neq' | 'contains' | 'gt' | 'gte' | 'lt' | 'lte' | 'in';
  value: unknown;
}

export const filterSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(['eq', 'neq', 'contains', 'gt', 'gte', 'lt', 'lte', 'in']),
  value: z.unknown(),
});

export const filterRequestSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortName: z.string().optional(),
  sortBy: z.enum(['asc', 'desc']).default('desc'),
  filters: z.array(filterSchema).optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type FilterRequestInput = z.infer<typeof filterRequestSchema>;
