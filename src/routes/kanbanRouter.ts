import { Router } from 'express'
import {
  createBoard,
  deleteBoard,
  deleteBoardTask,
  getAllBoards,
  getBoardTask,
  getSingleBoard,
  updateBoardName,
  updateBoardTask,
  createOrUpdateBoardTask,
  updateTaskStatus,
  updateSubtaskStatus,
} from '../controller/kanbanController'
import {
  validateBoardName,
  validateIdParam,
  validateTaskInput,
  vaidateTaskStatus,
} from '../middleware/validationMiddleware'

const router = Router()

router
  .get('/boards', getAllBoards)
  .post('/boards/create', validateBoardName, createBoard)
  .get('/boards/:id', validateIdParam, getSingleBoard)
  .delete('/boards/:id', validateIdParam, deleteBoard)
  .patch('/boards/:id', validateBoardName, updateBoardName)
  .get('/boards/:id/tasks/:taskId', validateIdParam, getBoardTask)
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
