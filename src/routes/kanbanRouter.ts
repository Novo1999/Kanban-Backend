import { Router } from 'express'
import {
  createBoard,
  createOrUpdateBoardTask,
  deleteBoard,
  deleteBoardTask,
  getAllBoards,
  getBoardTask,
  getSingleBoard,
  updateBoardAcceptInviteUser,
  updateBoardInviteUser,
  updateBoardName,
  updateBoardTask,
  updateSubtaskStatus,
  updateTaskStatus,
} from '../controller/kanbanController'
import {
  vaidateTaskStatus,
  validateBoardName,
  validateIdParam,
  validateInviteParam,
  validateTaskInput,
} from '../middleware/validationMiddleware'

const router = Router()

router
  .get('/boards', getAllBoards)
  .post('/boards/create', validateBoardName, createBoard)
  .get('/boards/:id', validateIdParam, getSingleBoard)
  .get('/invite/boards/:id', validateInviteParam, getSingleBoard)
  .delete('/boards/:id', validateIdParam, deleteBoard)
  .patch('/boards/:id', validateBoardName, updateBoardName)
  .post('/boards/:id/invite-user', validateIdParam, updateBoardInviteUser)
  .patch('/boards/:id/accept-invite', validateInviteParam, updateBoardAcceptInviteUser)
  .get('/boards/:id/tasks/:taskId', validateIdParam, getBoardTask)
  .post(
    '/boards/:id/create-task',
    validateIdParam,
    validateTaskInput,
    createOrUpdateBoardTask
  )
  .patch(
    '/boards/:id/create-task',
    validateIdParam,
    validateTaskInput,
    createOrUpdateBoardTask
  )
  .patch('/boards/:id/:taskId', validateIdParam, updateBoardTask)
  .patch(
    '/boards/:id/tasks/:taskId/edit-subtask/:subtaskId',
    validateIdParam,
    updateSubtaskStatus
  )
  .patch(
    '/boards/:id/:taskId/change-status',
    validateIdParam,
    vaidateTaskStatus,
    updateTaskStatus
  )
  .delete('/boards/:id/:taskId', validateIdParam, deleteBoardTask)

export default router
