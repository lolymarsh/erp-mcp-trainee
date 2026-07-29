import type { Response } from "express";

export interface PaginationResponse {
  page: number;
  pageSize: number;
  totalData: number;
  totalPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function CalculatePagination(
  page: number,
  pageSize: number,
  totalData: number,
): PaginationResponse {
  const totalPage = Math.ceil(totalData / pageSize);
  return {
    page,
    pageSize,
    totalData,
    totalPage,
    hasNextPage: page < totalPage,
    hasPreviousPage: page > 1,
  };
}

export function SendSuccess<T>(
  res: Response,
  code: number,
  message: string,
  payload?: { data: T; pagination?: PaginationResponse },
): void {
  const body: Record<string, unknown> = { code, message };
  if (payload) {
    body.data = payload.data;
    if (payload.pagination) {
      body.pagination = payload.pagination;
    }
  }
  res.status(code).json(body);
}

export function SendError(
  res: Response,
  code: number,
  message: string,
  details?: Record<string, unknown>,
): void {
  const body: Record<string, unknown> = { code, message };
  if (details) body.details = details;
  res.status(code).json(body);
}
