import { AppError } from "../utils"

export const isAuthenticated = (req, res, next) => {
  if (!req.user) next(new AppError("not authorized", 403))
  else next()
}
