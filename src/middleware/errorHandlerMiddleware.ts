import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
export const ErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR
  const message = err.message || 'Something went wrong'
  res.status(status).json({
    success: false,
    status: status,
    message: message,
    // the stack trace will only be printed in development
    stack: process.env.NODE_ENV === 'development' ? err.stack : {},
  })
}
