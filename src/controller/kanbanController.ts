import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import Board from '../model/KanbanModel'
import { NotFoundError } from '../error/customErrors'
import { taskFinder } from '../utils/taskFinder'
import { countTasks } from '../utils/countTasks'

interface GetAllBoard extends Request {
  user?: {
    userId: string
  }
}

// Get all boards
export const getAllBoards = async (req: GetAllBoard, res: Response) => {
  const boards = await Board.find({ createdBy: req?.user?.userId })
  res.status(StatusCodes.OK).json(boards)
}

// Get only one board using param Id
export const getSingleBoard = async (req: Request, res: Response) => {
  const { id: boardId } = req.params
  const board = await Board.findById(boardId)
  res.status(StatusCodes.OK).json(board)
}

// interface for the create board request
interface CreateBoardRequest extends Request {
  user?: string
}

type CreateBoard = (req: Request, res: Response) => void

// this creates the kanban board
export const createBoard: CreateBoard = async (
  req: CreateBoardRequest,
  res: Response
) => {
  const { userId }: any = req.user
  const board = await Board.create({
    ...req.body,
    createdBy: userId,
    statusCount: [],
  })
  res.status(StatusCodes.CREATED).json({ msg: 'board created', board })
}

// update only the board name
export const updateBoardName = async (req: Request, res: Response) => {
  const { id: boardId } = req.params
  const board = await Board.findOneAndUpdate({ _id: boardId }, req.body, {
    new: true,
  })
  res.status(StatusCodes.OK).json(board)
}

// delete the board
export const deleteBoard = async (req: Request, res: Response) => {
  const { id: boardId } = req.params
  await Board.findOneAndRemove({ _id: boardId })
  res.status(StatusCodes.OK).json({ msg: 'board deleted successfully' })
}

// create or update the board task using board Id
export const createOrUpdateBoardTask = async (req: Request, res: Response) => {
  const { id: boardId } = req.params

  const newBoard = await Board.findOneAndUpdate(
    { _id: boardId },

    {
      $push: {
        tasks: [
          {
            ...req.body,
            ...req.body.subtasks.map(
              (item: { name: string; status: string }) => {
                if (item.status === '') item.status = 'undone'
              }
            ),
          },
        ],
      },
    },
    {
      new: true,
    }
  )

  countTasks(boardId)

  res.status(StatusCodes.OK).json(newBoard)
}

type BoardTask = {
  subtasks: Array<{}>
  status: string
  title?: string | undefined
  description?: string | undefined
  _id?: string
  find: (item: {}) => {}
}

// get one task from a board using the board and task id
export const getBoardTask = async (req: Request, res: Response) => {
  const { id: boardId } = req.params
  const { taskId } = req.params

  const board: any = await Board.findById(boardId)

  const task = taskFinder(board, taskId)

  res.status(StatusCodes.OK).json(task)
}

type TaskToUpdate = {
  title: string
  description?: string
  subtasks?: Array<{
    name: string
    status: string
  }>
  status: string
}

// update a task in the board
export const updateBoardTask = async (req: Request, res: Response) => {
  const { id: boardId } = req.params
  const { taskId } = req.params

  const { title, description, subtasks, status } = req.body

  const board: any = await Board.findById(boardId)

  const taskToUpdate: TaskToUpdate = board?.tasks.find(
    (item: BoardTask) => item._id?.toString() === taskId
  )

  taskToUpdate.title = title || taskToUpdate.title
  taskToUpdate.description = description || taskToUpdate.description
  taskToUpdate.subtasks = subtasks || taskToUpdate.subtasks
  taskToUpdate.subtasks?.map((task) => {
    if (task.status === '') task.status = 'undone'
  })

  taskToUpdate.status = status || taskToUpdate.status
  await board.save()

  const newBoard = await countTasks(boardId)

  res.status(StatusCodes.OK).json(newBoard)
}

// delete a task from the board
export const deleteBoardTask = async (req: Request, res: Response) => {
  const { id: boardId } = req.params
  const { taskId } = req.params

  const board: any = await Board.findById(boardId)

  if (board.tasks.length === 0)
    return res
      .status(StatusCodes.OK)
      .json({ msg: 'No task in board.please add some', board })

  const taskFromId = taskFinder(board, taskId)
  if (!taskFromId) throw new NotFoundError('No task by that id')

  const filteredTasks = board?.tasks.filter(
    (item: BoardTask) => item._id?.toString() !== taskId
  )

  board.tasks = filteredTasks

  await board.save()
  const newBoard = await countTasks(boardId)

  return res
    .status(StatusCodes.OK)
    .json({ msg: 'task deleted successfully', newBoard })
}

// when dragging the tasks in the frontend, only the status of that will be changed
export const updateTaskStatus = async (req: Request, res: Response) => {
  const { id: boardId, taskId } = req.params
  const { status } = req.body

  const board: any = await Board.findById(boardId)

  const taskToUpdate: {
    status?: string
  } = taskFinder(board, taskId)

  taskToUpdate.status = status

  await board.save()
  countTasks(boardId)
  res
    .status(StatusCodes.OK)
    .json({ msg: `Updated task status to ${status}`, taskToUpdate })
}

// for only updating the subtask status
export const updateSubtaskStatus = async (req: Request, res: Response) => {
  const { id: boardId, taskId, subtaskId } = req.params
  const subtask = req.body

  const board: any = await Board.findById(boardId)
  const task = taskFinder(board, taskId)

  const subTaskToUpdate = task.subtasks.find(
    (t) => t._id.toString() === subtaskId
  )

  if (subTaskToUpdate) subTaskToUpdate.status = subtask.status

  await board.save()

  res.status(StatusCodes.OK).json({ msg: 'updated' })
}
