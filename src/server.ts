import cookieParser from 'cookie-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import 'express-async-errors'
import mongoSanitize from 'express-mongo-sanitize'
import helmet from 'helmet'
import { StatusCodes } from 'http-status-codes'
import { connect } from 'mongoose'
import morgan from 'morgan'
import { createRouteHandler } from 'uploadthing/express'
import { authenticateUser } from './middleware/authMiddleware'
import { ErrorHandler } from './middleware/errorHandlerMiddleware'
import authRouter from './routes/authRouter'
import kanbanRouter from './routes/kanbanRouter'
import userRouter from './routes/userRouter'

import crypto from 'node:crypto'
import { uploadRouter } from './uploadthing'

globalThis.crypto = crypto as any

dotenv.config()
const app = express()

const DATABASE_URL = process.env.MONGO_URL!

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'))

const host = process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://kanban-novo-frontend.vercel.app'

app.use(express.json())
app.use(
  cors({
    origin: host,
    credentials: true,
  })
)
app.use(cookieParser())
app.use(helmet())
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }))
app.use(mongoSanitize())

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/kanban', authenticateUser as () => void, kanbanRouter)
app.use('/api/v1/users', authenticateUser as () => void, userRouter)

app.use(
  '/api/v1/uploadthing',
  createRouteHandler({
    router: uploadRouter,
  })
)

// to check if server works
app.get('/', (req, res) => {
  res.json({
    msg: 'server is up',
  })
})

app.use('*', (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({ msg: 'not found' })
})

app.use(ErrorHandler)

const port = process.env.PORT || 8080

const run = async () => {
  try {
    await connect(DATABASE_URL)
    app.listen(port, () => console.log(`Server listening to port ${port}`))
  } catch (error) {
    console.log(error)
    process.exit(1)
  }
}

run()
