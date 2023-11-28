import { Router } from 'express'
import { login, logout, register } from '../controller/authController'
import {
  validateLoginInput,
  validateRegisterInput,
} from '../middleware/validationMiddleware'

const router = Router()

router
  .post('/register', validateRegisterInput, register)
  .post('/login', validateLoginInput, login)
  .post('/logout', logout)

export default router
