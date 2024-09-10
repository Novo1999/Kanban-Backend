import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { NotFoundError } from '../error/customErrors'
import Board from '../model/KanbanModel'
import { countTasks } from '../utils/countTasks'
import { taskFinder } from '../utils/taskFinder'

// Interface for requests with user information
interface GetAllBoard extends Request {
  user?: {
    userId: string
  }
}

// Get all boards created by the user
export const getAllBoards = async (req: GetAllBoard, res: Response) => {
  const boards = await Board.find({ createdBy: req?.user?.userId })
  res.status(StatusCodes.OK).json(boards)
}

// Get a single board by boardId
export const getSingleBoard = async (req: Request, res: Response) => {
  const { id: boardId } = req.params
  const board = await Board.findById(boardId)
  if (!board) throw new NotFoundError('Board not found')
  res.status(StatusCodes.OK).json(board)
}

// Interface for the create board request with user info
interface CreateBoardRequest extends Request {
  user?: {
    userId: string
  }
}

// Create a new Kanban board
export const createBoard = async (req: CreateBoardRequest, res: Response) => {
  const { userId }: any = req.user
  const board = await Board.create({
    ...req.body,
    createdBy: userId,
    statusCount: [],
  })
  res.status(StatusCodes.CREATED).json({ msg: 'Board created', board })
}

// Update the name of the board
export const updateBoardName = async (req: Request, res: Response) => {
  const { id: boardId } = req.params
  const board = await Board.findOneAndUpdate({ _id: boardId }, req.body, {
    new: true,
  })
  if (!board) throw new NotFoundError('Board not found')
  res.status(StatusCodes.OK).json(board)
}

// Delete a board
export const deleteBoard = async (req: Request, res: Response) => {
  const { id: boardId } = req.params
  const board = await Board.findOneAndRemove({ _id: boardId })
  if (!board) throw new NotFoundError('Board not found')
  res.status(StatusCodes.OK).json({ msg: 'Board deleted successfully' })
}

// Create or update a task in a board with proper subtask handling
export const createOrUpdateBoardTask = async (req: Request, res: Response) => {
  const { id: boardId } = req.params

  const subtasksWithStatus = req.body.subtasks.map(
    (item: { name: string; status?: string }) => ({
      ...item,
      status: item.status || 'undone', // Ensure status is set to 'undone' if not provided
    })
  )

  const newBoard = await Board.findOneAndUpdate(
    { _id: boardId },
    {
      $push: {
        tasks: [
          {
            ...req.body,
            subtasks: subtasksWithStatus,
          },
        ],
      },
    },
    {
      new: true,
    }
  )

  await countTasks(boardId)
  res.status(StatusCodes.OK).json(newBoard)
}

// Get a single task from the board by boardId and taskId
export const getBoardTask = async (req: Request, res: Response) => {
  const { id: boardId, taskId } = req.params

  const board: any = await Board.findById(boardId)
  if (!board) throw new NotFoundError('Board not found')

  const task = taskFinder(board, taskId)
  if (!task) throw new NotFoundError('Task not found')

  res.status(StatusCodes.OK).json(task)
}

// Update a task in the board
export const updateBoardTask = async (req: Request, res: Response) => {
  const { id: boardId, taskId } = req.params

  const { title, description, subtasks, status } = req.body
  const board: any = await Board.findById(boardId)
  if (!board) throw new NotFoundError('Board not found')

  const taskToUpdate = board?.tasks.find(
    (item: { _id?: string }) => item._id?.toString() === taskId
  )
  if (!taskToUpdate) throw new NotFoundError('Task not found')

  // Update the task properties
  taskToUpdate.title = title || taskToUpdate.title
  taskToUpdate.description = description || taskToUpdate.description
  taskToUpdate.status = status || taskToUpdate.status

  // Update or set default subtask status
  taskToUpdate.subtasks = subtasks || taskToUpdate.subtasks
  taskToUpdate.subtasks.forEach((task: { status: string }) => {
    if (!status) task.status = 'undone'
  })

  await board.save()
  const updatedBoard = await countTasks(boardId)
  res.status(StatusCodes.OK).json(updatedBoard)
}

// Delete a task from the board
export const deleteBoardTask = async (req: Request, res: Response) => {
  const { id: boardId, taskId } = req.params
  const board: any = await Board.findById(boardId)
  if (!board) throw new NotFoundError('Board not found')

  const taskToDelete = taskFinder(board, taskId)
  if (!taskToDelete) throw new NotFoundError('Task not found')

  board.tasks = board.tasks.filter(
    (task: { _id?: string }) => task._id?.toString() !== taskId
  )

  await board.save()
  const updatedBoard = await countTasks(boardId)

  res.status(StatusCodes.OK).json({ msg: 'Task deleted successfully', updatedBoard })
}

// Update the status of a task when dragging in frontend
export const updateTaskStatus = async (req: Request, res: Response) => {
  const { id: boardId, taskId } = req.params
  const { status } = req.body

  const board: any = await Board.findById(boardId)
  if (!board) throw new NotFoundError('Board not found')

  const taskToUpdate = taskFinder(board, taskId)
  if (!taskToUpdate) throw new NotFoundError('Task not found')

  taskToUpdate.status = status
  await board.save()

  await countTasks(boardId)
  res.status(StatusCodes.OK).json({ msg: `Task status updated to ${status}`, taskToUpdate })
}

// Update only the subtask status
export const updateSubtaskStatus = async (req: Request, res: Response) => {
  const { id: boardId, taskId, subtaskId } = req.params
  const { status } = req.body

  const board: any = await Board.findById(boardId)
  if (!board) throw new NotFoundError('Board not found')

  const task = taskFinder(board, taskId)
  if (!task) throw new NotFoundError('Task not found')

  const subtaskToUpdate = task.subtasks.find(
    (subtask: { _id: string }) => subtask._id.toString() === subtaskId
  )
  if (!subtaskToUpdate) throw new NotFoundError('Subtask not found')

  subtaskToUpdate.status = status
  await board.save()

  res.status(StatusCodes.OK).json({ msg: 'Subtask status updated' })
}
