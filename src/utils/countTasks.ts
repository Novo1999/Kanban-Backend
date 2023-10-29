import mongoose from 'mongoose'
import Board from '../model/KanbanModel'

export const countTasks = async (id: string) => {
  const countQuery = await Board.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
      },
    },
    {
      $unwind: '$tasks',
    },
    {
      $group: {
        _id: '$tasks.status',
        count: {
          $sum: 1,
        },
      },
    },
  ]).exec()

  const newBoard = await Board.findOneAndUpdate(
    { _id: id },
    {
      statusCount: countQuery,
    },
    {
      new: true,
    }
  )
  return newBoard
}
