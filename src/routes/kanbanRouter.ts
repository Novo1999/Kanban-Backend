import { Router } from 'express'
import {
  createBoard,
  createOrUpdateBoardTask,
  deleteBoard,
  deleteBoardTask,
  getAllBoards,
  getBoardTask,
  getSingleBoard,
  updateBoardName,
  updateBoardTask,
  updateSubtaskStatus,
  updateTaskStatus,
} from '../controller/kanbanController'
import {
  vaidateTaskStatus,
  validateBoardName,
  validateIdParam,
  validateTaskInput,
} from '../middleware/validationMiddleware'

const router = Router()

router
  .get('/boards', getAllBoards)
  .post('/boards/create', validateBoardName, createBoard)
  .get('/boards/:id', validateIdParam, getSingleBoard)
  .delete('/boards/:id', validateIdParam, deleteBoard)
  .patch('/boards/:id', validateBoardName, updateBoardName)
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
