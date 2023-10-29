import { Router } from 'express'
import {
  editUserEmail,
  editUserName,
  editUserPassword,
  getCurrentUser,
} from '../controller/userController'
import {
  validateEditEmail,
  validateEditName,
  validateEditPassword,
} from '../middleware/validationMiddleware'

const router = Router()

router.get('/current-user', getCurrentUser)
router.patch('/edit-username', validateEditName, editUserName)
router.patch('/edit-userEmail', validateEditEmail, editUserEmail)
router.patch('/edit-userPassword', validateEditPassword, editUserPassword)

export default router
