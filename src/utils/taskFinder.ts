import { NotFoundError } from '../error/customErrors'

type BoardTask = {
  subtasks: Array<{ name: string; status: string; _id: string }>
  status: string
  title?: string | undefined
  description?: string | undefined
  _id?: string
  find: (item: {}) => {}
}

// this finds the task by id and was quite repetitive in the controller
export const taskFinder = (board: { tasks: BoardTask }, id: string) => {
  const task = board?.tasks.find(
    (item: { _id: string }) => item._id?.toString() === id
  ) as BoardTask
  if (!task) throw new NotFoundError('Task not Found')
  return task
}
