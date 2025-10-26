import { Response } from 'express';

interface ApiResponse<T = unknown> {
  status: number;
  data?: T;
  error?: string;
  code?: string;
  details?: unknown;
  timestamp?: string;
  path?: string;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    status: statusCode,
    data,
  };

  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: unknown,
  path?: string
): Response => {
  const response: ApiResponse = {
    status: statusCode,
    error: message,
    code,
    details,
    timestamp: new Date().toISOString(),
    path,
  };

  return res.status(statusCode).json(response);
};

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  },
  statusCode: number = 200
): Response => {
  return res.status(statusCode).json({
    status: statusCode,
    data,
    pagination,
  });
};
