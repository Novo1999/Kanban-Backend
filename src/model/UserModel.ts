import { Schema, model } from 'mongoose'

const UserSchema = new Schema(
  {
    name: String,
    email: String,
    password: String,
  },
  {
    toJSON: {
      transform(doc, ret) {
        delete ret.password
      },
    },
  }
)

export default model('User', UserSchema)
