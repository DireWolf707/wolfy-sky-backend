class AppError extends Error {
  statusCode
  isOperational
  constructor(message, statusCode = 400) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true // true for known errors

    Error.captureStackTrace(this, this.constructor)
  }
}

export default AppError
