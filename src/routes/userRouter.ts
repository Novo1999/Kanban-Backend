import { Router } from 'express'
import {
  editUserAvatar,
  editUserEmail,
  editUserName,
  editUserPassword,
  getCurrentUser,
  getUser,
} from '../controller/userController'
import {
  validateEditEmail,
  validateEditName,
  validateEditPassword,
} from '../middleware/validationMiddleware'

const router = Router()

router.get('/current-user', getCurrentUser)
router.get('/:email', getUser)
router.patch('/edit-username', validateEditName, editUserName)
router.patch('/edit-userEmail', validateEditEmail, editUserEmail)
router.patch('/edit-userPassword', validateEditPassword, editUserPassword)
router.patch('/edit-userAvatar', editUserAvatar)

export default router
