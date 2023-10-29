import bcrypt from 'bcryptjs'

export const hashPassword = (bodyPassword: string) => {
  const salt = bcrypt.genSaltSync(10)
  const hashedPassword = bcrypt.hashSync(bodyPassword, salt)
  return hashedPassword
}

export const comparePassword = async (
  password: string,
  hashedPassword: string
) => {
  const isMatch = await bcrypt.compare(password, hashedPassword)
  return isMatch
}
