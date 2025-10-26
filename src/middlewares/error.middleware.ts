import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errorHandler';
import { HTTP_STATUS, ERROR_CODES } from '../utils/constants';
import logger from '../config/logger';
import { sendError } from '../utils/response';

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Log error
  logger.error('Error:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Handle known operational errors
  if (error instanceof AppError && error.isOperational) {
    return sendError(
      res,
      error.message,
      error.statusCode,
      error.code,
      error.details,
      req.path
    );
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as { code: string; meta?: { target?: string[] } };

    if (prismaError.code === 'P2002') {
      return sendError(
        res,
        'A record with this value already exists',
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.CONFLICT,
        { field: prismaError.meta?.target?.[0] },
        req.path
      );
    }

    if (prismaError.code === 'P2025') {
      return sendError(
        res,
        'Record not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.NOT_FOUND,
        undefined,
        req.path
      );
    }
  }

  // Handle unexpected errors
  return sendError(
    res,
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : error.message,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    ERROR_CODES.INTERNAL_ERROR,
    process.env.NODE_ENV === 'production' ? undefined : { stack: error.stack },
    req.path
  );
};

export const notFoundHandler = (req: Request, res: Response) => {
  sendError(
    res,
    `Route ${req.method} ${req.path} not found`,
    HTTP_STATUS.NOT_FOUND,
    ERROR_CODES.NOT_FOUND,
    undefined,
    req.path
  );
};
