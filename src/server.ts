import 'express-async-errors'
import { StatusCodes } from 'http-status-codes'
import morgan from 'morgan'
import express from 'express'
import dotenv from 'dotenv'
import authRouter from './routes/authRouter'
import { ErrorHandler } from './middleware/errorHandlerMiddleware'
import { connect } from 'mongoose'
import cookieParser from 'cookie-parser'
import kanbanRouter from './routes/kanbanRouter'
import userRouter from './routes/userRouter'
import { authenticateUser } from './middleware/authMiddleware'
import cors from 'cors'
import helmet from 'helmet'
import mongoSanitize from 'express-mongo-sanitize'

dotenv.config()
const app = express()

const DATABASE_URL = process.env.MONGO_URL!

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'))


app.use(express.json())
app.use(
  cors({
    origin: 'https://kanban-novo-frontend.vercel.app',
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
