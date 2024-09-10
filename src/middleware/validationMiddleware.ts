import { NextFunction, Request, Response } from 'express'
import { body, param, validationResult } from 'express-validator'
import mongoose from 'mongoose'
import { TASK_STATUS } from '../constant'
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from '../error/customErrors'
import Board from '../model/KanbanModel'
import User from '../model/UserModel'

const withValidationErrors = (validateValues: any) => {
  return [
    validateValues,
    (req: Request, res: Response, next: NextFunction) => {
      const errors = validationResult(req)

      if (errors.isEmpty()) return next()

      const errorMessages = errors.array().map((err) => err.msg)

      throw new BadRequestError(errorMessages)
    },
  ]
}

// this validates the register input fields
export const validateRegisterInput = withValidationErrors([
  body('name')
    .notEmpty()
    .withMessage('name cannot be empty')
    .isLength({ min: 3 })
    .withMessage('name must be at least 3 characters'),
  body('email')
    .notEmpty()
    .withMessage('email cannot be empty')
    .isEmail()
    .withMessage('please provide valid email address')
    .custom(async (email) => {
      const userExists = await User.findOne({ email: email.toLowerCase() })
      if (userExists)
        throw new BadRequestError(
          'An user with the email address already exists.Please log in'
        )
    }),
  body('password')
    .notEmpty()
    .withMessage('password cannot be empty')
    .isLength({ min: 6 })
    .withMessage('password must be at least 6 characters')

])

export const validateEditName = withValidationErrors([
  body('name')
    .notEmpty()
    .withMessage('name cannot be empty')
    .isLength({ min: 3 })
    .withMessage('name must be at least 3 characters'),
])
export const validateEditEmail = withValidationErrors([
  body('email')
    .notEmpty()
    .withMessage('email cannot be empty')
    .isEmail()
    .withMessage('please provide valid email address')
    .custom(async (email) => {
      const userExists = await User.findOne({ email: email.toLowerCase() })
      if (userExists)
        throw new BadRequestError(
          'An user with the email address already exists.Please use another email'
        )
    }),
])
export const validateEditPassword = withValidationErrors([
  body('password')
    .notEmpty()
    .withMessage('password cannot be empty')
    .isLength({ min: 6 })
    .withMessage('password must be at least 6 characters')
])

// this validates the login input fields
export const validateLoginInput = withValidationErrors([
  body('email')
    .isEmail()
    .withMessage('please provide valid email address')
    .notEmpty()
    .withMessage('email is required')
    .custom(async (email) => {
      const userExists = await User.findOne({ email: email.toLowerCase() })
      if (!userExists)
        throw new BadRequestError('No user found by that email.Please Register')
    }),
  body('password').notEmpty().withMessage('password is required'),
])

export const validateBoardName = withValidationErrors([
  body('boardName')
    .notEmpty()
    .withMessage('Please provide a board name')
    .isLength({ max: 45 })
    .withMessage('your board name exceeds the limit of 45 characters'),
])

export const validateTaskInput = withValidationErrors([
  body('status')
    .isIn(Object.values(TASK_STATUS))
    .withMessage('invalid status type'),
  body('title').notEmpty().withMessage('title cannot be empty'),
  body('subtasks').isArray().withMessage('wrong input'),
])

export const vaidateTaskStatus = withValidationErrors([
  body('status')
    .isIn(Object.values(TASK_STATUS))
    .withMessage('invalid status type'),
])

// if the mongo id is invalid,throw an error, if the user is not sending request, throw an unauthorized error
export const validateIdParam = withValidationErrors([
  param(['id']).custom(async (value, { req }) => {
    const isValidId = mongoose.Types.ObjectId.isValid(value)
    if (!isValidId) throw new BadRequestError('invalid id')

    const board = await Board.findById(value)
    if (!board) throw new NotFoundError('No board found by that id')

    const isOwner = req.user.userId === board.createdBy?.toString()
    if (!isOwner)
      throw new UnauthorizedError('not authorized to access this information')
  }),
])
