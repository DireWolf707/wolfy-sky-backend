import { AppError } from "../utils"

const handlePayloadTooLargeError = () => new AppError("payload too large")
const handleCastErrorDB = () => new AppError("invalid data")
const handleLongValueErrorDB = () => new AppError("data too long")
const handleUniqueConstraintErrorDB = ({ message: errMsg }) => {
  const field = errMsg.split('"')[1]
  const error = `${field}:${field} is already in use`
  return new AppError(error)
}
const handleValidationError = (err) => {
  const errors = err.issues.map(({ path, message }) => `${path[0]}:${message}`)
  const message = errors.join(",")
  return new AppError(message)
}
const handleRazorpayMaxAmountError = () => new AppError("order amount cannot exceed Rs. 5 lakhs")

export default (err, req, res, next) => {
  // express errors
  if (err.type === "entity.too.large") err = handlePayloadTooLargeError()
  // zod errors
  if (err.name === "ZodError") err = handleValidationError(err)
  // db errors
  if (err.code === "22001") err = handleLongValueErrorDB()
  if (err.code === "23505") err = handleUniqueConstraintErrorDB(err)
  if (err.code === "22P02") err = handleCastErrorDB()
  // razorpay
  if (err.error?.step === "payment_initiation") err = handleRazorpayMaxAmountError()

  console.log({ ...err, messsage: err.message, code: err.code })

  // Operational error: send message to client
  if (err.isOperational)
    res.status(err.statusCode).json({
      message: err.message,
    })
  // Unknown error: don't send error details
  else
    res.status(500).json({
      message: "something went wrong",
    })
}
