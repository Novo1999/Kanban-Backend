import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { Types } from 'mongoose'
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
  const boards = await Board.find({
    $or: [
      { createdBy: req?.user?.userId }, // Boards created by the user
      { acceptedInviteUsers: req?.user?.userId }, // Boards where user is an accepted member
    ],
    $and: [
      {
        $or: [{ boardName: { $regex: req.query.query || '', $options: 'i' } }, { tasks: { $elemMatch: { title: { $regex: req.query.query || '', $options: 'i' } } } }],
      },
    ],
  })
    .select(['boardName', 'createdBy', 'order'])
    .populate('createdBy')

  res.status(StatusCodes.OK).json(boards)
}

// Get a single board by boardId
export const getSingleBoard = async (req: Request, res: Response) => {
  const { id: boardId } = req.params
  const board = await Board.findById(boardId).populate('acceptedInviteUsers').populate('invitedUsers')
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
  const subtasksWithStatus = req.body.subtasks.map((item: { name: string; status?: string; priority?: string }) => ({
    ...item,
    status: item.status || 'undone', // Ensure status is set to 'undone' if not provided
  }))

  const assigned = req.body.assigned

  const newBoard = await Board.findOneAndUpdate(
    { _id: boardId },
    {
      $push: {
        tasks: [
          {
            ...req.body,
            subtasks: subtasksWithStatus,
            assigned,
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

export const reorderBoard = async (req: Request & { user: { userId: string } }, res: Response) => {
  const userId = req.user?.userId
  const newBoardOrder = req.body?.data // Should be array of {boardId, order} objects
  console.log('🚀 ~ reorderBoard ~ newBoardOrder:', newBoardOrder)

  if (!newBoardOrder || !Array.isArray(newBoardOrder)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: 'Invalid data format. Expected array of board updates.',
    })
  }

  try {
    // Create bulk operations with proper filter
    const bulkOperations = newBoardOrder.map(({ boardId, order }) => ({
      updateOne: {
        filter: {
          _id: new Types.ObjectId(boardId),
          createdBy: new Types.ObjectId(userId),
        },
        update: {
          order: order,
        },
      },
    }))

    await Board.bulkWrite(bulkOperations)

    // Get updated boards to return
    const updatedBoards = await Board.find({ createdBy: userId }).sort({ order: 1 })

    res.status(StatusCodes.OK).json(updatedBoards)
  } catch (error) {
    console.error('Error reordering boards:', error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to reorder boards',
    })
  }
}

// Invite a user to a board (add to invitedUsers array)
export const updateBoardInviteUser = async (req: Request, res: Response) => {
  const { id: boardId } = req.params
  const { userId } = req.body // The user ID to invite

  // Validate required fields
  if (!userId) {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'User ID is required' })
  }

  const board = await Board.findById(boardId)
  if (!board) throw new NotFoundError('Board not found')

  // Check if user is already invited
  const isAlreadyInvited = board.invitedUsers.includes(userId)
  if (isAlreadyInvited) {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'User is already invited' })
  }

  // Check if user has already accepted an invite (is in acceptedInviteUsers)
  const hasAlreadyAccepted = board.acceptedInviteUsers.includes(userId)
  if (hasAlreadyAccepted) {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'User is already a member of this board' })
  }

  // Add user to invitedUsers array
  const updatedBoard = await Board.findByIdAndUpdate(
    boardId,
    { $addToSet: { invitedUsers: userId } }, // $addToSet ensures no duplicates
    { new: true }
  ).populate('invitedUsers', 'name email') // Populate with user details if needed

  res.status(StatusCodes.OK).json({
    msg: 'User invited successfully',
    board: updatedBoard,
  })
}

// Accept board invitation (move user from invitedUsers to acceptedInviteUsers)
export const updateBoardAcceptInviteUser = async (req: Request, res: Response) => {
  const { id: boardId } = req.params
  const { userId } = req.body // The user ID accepting the invitation

  // Validate required fields
  if (!userId) {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'User ID is required' })
  }

  const board = await Board.findById(boardId)
  if (!board) throw new NotFoundError('Board not found')

  // Check if user was actually invited
  const isInvited = board.invitedUsers.includes(userId)
  if (!isInvited) {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'User was not invited to this board' })
  }

  // Check if user has already accepted
  const hasAlreadyAccepted = board.acceptedInviteUsers.includes(userId)
  if (hasAlreadyAccepted) {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'User has already accepted the invitation' })
  }

  // Move user from invitedUsers to acceptedInviteUsers
  const updatedBoard = await Board.findByIdAndUpdate(
    boardId,
    {
      $pull: { invitedUsers: userId }, // Remove from invited
      $addToSet: { acceptedInviteUsers: userId }, // Add to accepted
    },
    { new: true }
  ).populate('acceptedInviteUsers', 'name email') // Populate with user details if needed

  res.status(StatusCodes.OK).json({
    msg: 'Invitation accepted successfully',
    board: updatedBoard,
  })
}
// Remove an accepted user from a board
export const removeBoardAcceptInviteUser = async (req: Request, res: Response) => {
  const { id: boardId } = req.params
  const { userId } = req.body // The user ID to remove

  // Validate required fields
  if (!userId) {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'User ID is required' })
  }

  const board = await Board.findById(boardId)
  if (!board) throw new NotFoundError('Board not found')

  // Check if user is actually an accepted member
  const isAcceptedMember = board.acceptedInviteUsers.includes(userId)
  if (!isAcceptedMember) {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'User is not a member of this board' })
  }

  // Remove user from acceptedInviteUsers array
  const updatedBoard = await Board.findByIdAndUpdate(boardId, { $pull: { acceptedInviteUsers: userId, 'tasks.$[].assigned': { user: userId } } }, { new: true }).populate(
    'acceptedInviteUsers',
    'name email'
  )

  res.status(StatusCodes.OK).json({
    msg: 'User removed from board successfully',
    board: updatedBoard,
  })
}

// Get a single task from the board by boardId and taskId
export const getBoardTask = async (req: Request, res: Response) => {
  const { id: boardId, taskId } = req.params

  const board: any = await Board.findById(boardId).populate('tasks.assigned.assignedBy tasks.assigned.user')
  if (!board) throw new NotFoundError('Board not found')

  const task = taskFinder(board, taskId)
  if (!task) throw new NotFoundError('Task not found')

  res.status(StatusCodes.OK).json(task)
}

// Update a task in the board
export const updateBoardTask = async (req: Request, res: Response) => {
  const { id: boardId, taskId } = req.params

  const { title, description, subtasks, status, timeTracked, priority, assigned } = req.body
  console.log('🚀 ~ updateBoardTask ~ assigned:', assigned)
  const board: any = await Board.findById(boardId)
  if (!board) throw new NotFoundError('Board not found')

  const taskToUpdate = board?.tasks.find((item: { _id?: string }) => item._id?.toString() === taskId)
  if (!taskToUpdate) throw new NotFoundError('Task not found')

  // Update the task properties
  taskToUpdate.title = title || taskToUpdate.title
  taskToUpdate.description = description || taskToUpdate.description
  taskToUpdate.status = status || taskToUpdate.status
  taskToUpdate.priority = priority || taskToUpdate.priority
  taskToUpdate.timeTracked = timeTracked >= 0 ? timeTracked : taskToUpdate.timeTracked
  taskToUpdate.assigned = assigned

  // Update or set default subtask status
  taskToUpdate.subtasks = subtasks
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

  board.tasks = board.tasks.filter((task: { _id?: string }) => task._id?.toString() !== taskId)

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

  const subtaskToUpdate = task.subtasks.find((subtask: { _id: string }) => subtask._id.toString() === subtaskId)
  if (!subtaskToUpdate) throw new NotFoundError('Subtask not found')

  subtaskToUpdate.status = status

  await board.save()

  res.status(StatusCodes.OK).json({ msg: 'Subtask status updated' })
}
