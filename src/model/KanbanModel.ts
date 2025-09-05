import mongoose, { Schema, model } from 'mongoose'
import { TASK_STATUS } from '../constant'

const KanbanSchema = new Schema(
  {
    boardName: String,
    order: Number,
    tasks: [
      {
        title: String,
        description: String,
        subtasks: [
          {
            name: String,
            status: {
              type: String,
              default: 'undone',
            },
          },
        ],
        assigned: [
          {
            user: {
              type: Schema.Types.ObjectId,
              ref: 'User',
            },
            assignedBy: {
              type: Schema.Types.ObjectId,
              ref: 'User',
            },
            assignedAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
        status: {
          type: String,
          enum: Object.values(TASK_STATUS),
          default: TASK_STATUS.TASK,
        },
        timeTracked: Number,
        deadline: { type: Date, default: null },
        priority: { type: String },
        createdBy: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
    statusCount: {
      task: Number,
      progress: Number,
      completed: Number,
    },
    invitedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    acceptedInviteUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
)

export default model('Board', KanbanSchema)
