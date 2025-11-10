import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError, errorHandler, asyncHandler } from '../../../presentation/middleware/error.middleware';
import { HTTP_STATUS, RESPONSE_STATUS } from '../../../presentation/constants/http-status';

// Skip global setup for unit tests (no database needed)
jest.mock('../../../infrastructure/database/prisma');

describe('Error Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('AppError', () => {
    it('should create an AppError with statusCode and message', () => {
      const error = new AppError(HTTP_STATUS.NOT_FOUND, 'Resource not found');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Resource not found');
      expect(error.isOperational).toBe(true);
    });

    it('should create an AppError with custom isOperational flag', () => {
      const error = new AppError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Critical error', false);

      expect(error.isOperational).toBe(false);
    });

    it('should have correct prototype chain', () => {
      const error = new AppError(HTTP_STATUS.BAD_REQUEST, 'Bad request');

      expect(Object.getPrototypeOf(error)).toBe(AppError.prototype);
    });
  });

  describe('errorHandler', () => {
    it('should handle AppError with correct status code and message', () => {
      const error = new AppError(HTTP_STATUS.NOT_FOUND, 'Item not found');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        status: RESPONSE_STATUS.ERROR,
        message: 'Item not found',
      });
    });

    it('should handle AppError with CONFLICT status', () => {
      const error = new AppError(HTTP_STATUS.CONFLICT, 'Duplicate entry');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        status: RESPONSE_STATUS.ERROR,
        message: 'Duplicate entry',
      });
    });

    it('should handle Prisma P2002 error (unique constraint)', () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.0.0',
      });

      errorHandler(prismaError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.CONFLICT);
      expect(jsonMock).toHaveBeenCalledWith({
        status: RESPONSE_STATUS.ERROR,
        message: 'A record with this value already exists',
      });
    });

    it('should handle Prisma P2025 error (record not found)', () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Record to update not found', {
        code: 'P2025',
        clientVersion: '5.0.0',
      });

      errorHandler(prismaError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(jsonMock).toHaveBeenCalledWith({
        status: RESPONSE_STATUS.ERROR,
        message: 'Record not found',
      });
    });

    it('should handle unknown Prisma error', () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Unknown error', {
        code: 'P9999',
        clientVersion: '5.0.0',
      });

      errorHandler(prismaError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(jsonMock).toHaveBeenCalledWith({
        status: RESPONSE_STATUS.ERROR,
        message: 'Database error',
      });
    });

    it('should handle generic Error', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const genericError = new Error('Something went wrong');

      errorHandler(genericError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(jsonMock).toHaveBeenCalledWith({
        status: RESPONSE_STATUS.ERROR,
        message: 'Internal server error',
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('ERROR 💥', genericError);

      consoleErrorSpy.mockRestore();
    });

    it('should not call next function', () => {
      const error = new AppError(HTTP_STATUS.BAD_REQUEST, 'Bad request');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('asyncHandler', () => {
    it('should call the async function and resolve successfully', async () => {
      const asyncFn = jest.fn().mockResolvedValue({ data: 'success' });
      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(mockRequest as Request, mockResponse as Response, mockNext);

      expect(asyncFn).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should catch errors and pass to next middleware', async () => {
      const testError = new Error('Async error');
      const asyncFn = jest.fn().mockRejectedValue(testError);
      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(mockRequest as Request, mockResponse as Response, mockNext);

      expect(asyncFn).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
      expect(mockNext).toHaveBeenCalledWith(testError);
    });

    it('should catch AppError and pass to next middleware', async () => {
      const appError = new AppError(HTTP_STATUS.NOT_FOUND, 'Not found');
      const asyncFn = jest.fn().mockRejectedValue(appError);
      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(appError);
    });

    it('should catch Prisma errors and pass to next middleware', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Prisma error', {
        code: 'P2002',
        clientVersion: '5.0.0',
      });
      const asyncFn = jest.fn().mockRejectedValue(prismaError);
      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(prismaError);
    });

    it('should handle async function that returns void', async () => {
      const asyncFn = jest.fn().mockResolvedValue(undefined);
      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(mockRequest as Request, mockResponse as Response, mockNext);

      expect(asyncFn).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should preserve function context', async () => {
      let capturedReq: Request | undefined;
      let capturedRes: Response | undefined;
      let capturedNext: NextFunction | undefined;

      const asyncFn = jest.fn().mockImplementation(async (req, res, next) => {
        capturedReq = req;
        capturedRes = res;
        capturedNext = next;
      });

      const wrappedFn = asyncHandler(asyncFn);
      await wrappedFn(mockRequest as Request, mockResponse as Response, mockNext);

      expect(capturedReq).toBe(mockRequest);
      expect(capturedRes).toBe(mockResponse);
      expect(capturedNext).toBe(mockNext);
    });
  });

  describe('Integration: asyncHandler + errorHandler', () => {
    it('should handle full error flow from asyncHandler to errorHandler', async () => {
      const appError = new AppError(HTTP_STATUS.BAD_REQUEST, 'Invalid request data');
      const asyncFn = jest.fn().mockRejectedValue(appError);
      const wrappedFn = asyncHandler(asyncFn);

      // Simulate asyncHandler catching error and passing to errorHandler
      await wrappedFn(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(appError);

      // Now errorHandler processes the error
      const nextMock = mockNext as jest.Mock;
      const error = nextMock.mock.calls[0][0];
      errorHandler(error, mockRequest as Request, mockResponse as Response, jest.fn());

      expect(statusMock).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(jsonMock).toHaveBeenCalledWith({
        status: RESPONSE_STATUS.ERROR,
        message: 'Invalid request data',
      });
    });
  });
});
