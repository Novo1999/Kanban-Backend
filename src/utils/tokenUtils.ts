import jwt from 'jsonwebtoken'

type Token = {
  userId: string
  email: string
}

export const createJWT = (payload: Token): string => {
  const token = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_TIMEOUT,
  })
  return token
}

export const verifyJWT = (token: string): Token => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET!)
  return decoded as Token
}
