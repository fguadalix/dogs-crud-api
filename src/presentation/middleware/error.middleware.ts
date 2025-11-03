import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { HTTP_STATUS, RESPONSE_STATUS } from '../constants/http-status';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

const handlePrismaError = (err: Prisma.PrismaClientKnownRequestError): { status: number; message: string } => {
  switch (err.code) {
    case 'P2002':
      return { status: HTTP_STATUS.CONFLICT, message: 'A record with this value already exists' };
    case 'P2025':
      return { status: HTTP_STATUS.NOT_FOUND, message: 'Record not found' };
    default:
      return { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, message: 'Database error' };
  }
};

/* eslint-disable @typescript-eslint/no-unused-vars */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  /* eslint-enable @typescript-eslint/no-unused-vars */
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: RESPONSE_STATUS.ERROR,
      message: err.message,
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const { status, message } = handlePrismaError(err);
    res.status(status).json({ status: RESPONSE_STATUS.ERROR, message });
    return;
  }

  console.error('ERROR 💥', err);
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    status: RESPONSE_STATUS.ERROR,
    message: 'Internal server error',
  });
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
