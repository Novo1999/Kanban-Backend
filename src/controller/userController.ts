import { Request, Response } from 'express'
import User from '../model/UserModel'
import { StatusCodes } from 'http-status-codes'
import { hashPassword } from '../utils/passwordUtils'
import { BadRequestError } from '../error/customErrors'

interface GetCurrentUserRequest extends Request {
  user?: {
    email: string
    userId: string
  }
}

export const getCurrentUser = async (
  req: GetCurrentUserRequest,
  res: Response
) => {
  const currentUser = await User.findById(req?.user?.userId)

  res.status(StatusCodes.OK).json(currentUser)
}

export const editUserName = async (
  req: GetCurrentUserRequest,
  res: Response
) => {
  const currentUser = await User.findById(req?.user?.userId)

  if (currentUser?.email === 'test@gmail.com') {
    throw new BadRequestError('Demo User, Cannot Change Profile Settings')
  }

  const user = await User.findOneAndUpdate(
    { email: currentUser?.email },
    req.body
  )

  return res.status(StatusCodes.OK).json(user)
}

export const editUserEmail = async (
  req: GetCurrentUserRequest,
  res: Response
) => {
  const currentUser = await User.findById(req?.user?.userId)

  if (currentUser?.email === 'test@gmail.com') {
    throw new BadRequestError('Demo User, Cannot Change Profile Settings')
  }

  const user = await User.findOneAndUpdate(
    { email: currentUser?.email },
    req.body
  )
  return res.status(StatusCodes.OK).json(user)
}

export const editUserPassword = async (
  req: GetCurrentUserRequest,
  res: Response
) => {
  const currentUser = await User.findById(req?.user?.userId)

  if (currentUser?.email === 'test@gmail.com') {
    throw new BadRequestError('Demo User, Cannot Change Profile Settings')
  }

  if (req.body.password) {
    req.body.password = hashPassword(req.body.password)
  }
  const user = await User.findOneAndUpdate(
    { email: currentUser?.email },
    req.body
  )
  return res.status(StatusCodes.OK).json(user)
}
