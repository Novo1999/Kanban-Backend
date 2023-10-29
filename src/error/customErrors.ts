import { StatusCodes } from 'http-status-codes'

export class NotFoundError extends Error {
  statusCode: number
  constructor(message: any) {
    super(message)
    this.statusCode = StatusCodes.NOT_FOUND
  }
}

export class UnauthenticatedError extends Error {
  statusCode: number
  constructor(message: any) {
    super(message)
    this.statusCode = StatusCodes.UNAUTHORIZED
  }
}

export class BadRequestError extends Error {
  statusCode: number
  constructor(message: any) {
    super(message)
    this.statusCode = StatusCodes.BAD_REQUEST
  }
}

export class UnauthorizedError extends Error {
  statusCode: number
  constructor(message: any) {
    super(message)
    this.statusCode = StatusCodes.FORBIDDEN
  }
}
