// Global Exception Handler
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! Shutting down...")
  console.error(err.name, err.message)
  if (process.env.NODE_ENV === "production") process.exit(1)
})

import "./configs"
import http from "http"
import app from "./app"
import { setUpSocket } from "./socket"

// Server Init
const httpServer = setUpSocket(http.createServer(app))
// Server Start
const port = process.env.PORT || 3000
const server = httpServer.listen(port, () => console.log(`App running on port ${port}...`))

// Global Promise Rejection Handler
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! Shutting down...")
  console.error(err.name, err.message)
  server.close(() => process.env.NODE_ENV === "production" && process.exit(1))
})

// SIGTERM Handler
process.on("SIGTERM", () => {
  console.error("SIGTERM RECEIVED! Shutting down gracefully")
  server.close(() => console.log("Process terminated!"))
})
