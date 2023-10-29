import { NextFunction, Response } from 'express'
import { UnauthenticatedError } from '../error/customErrors'
import { verifyJWT } from '../utils/tokenUtils'

type Request = {
  cookies: {
    token: string
  }
  user: {
    userId: string
    email: string
  }
}

export const authenticateUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { token } = req.cookies
  if (!token) throw new UnauthenticatedError('authentication invalid')
  try {
    const { userId, email } = verifyJWT(token)
    req.user = { userId, email }
    next()
  } catch (error) {
    throw new UnauthenticatedError('authentication invalid')
  }
}
