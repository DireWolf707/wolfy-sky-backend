import passport from "passport"
import { Server } from "socket.io"
import { sessionMiddleware, socketMiddlewareWrapper, corsOptions } from "./middlewares/global"
import { isAuthenticated } from "./middlewares/auth"
import { redis } from "./configs"

export let io

export const setUpSocket = (httpServer) => {
  io = new Server(httpServer, {
    serveClient: false,
    cors: corsOptions,
  })
  io.use(socketMiddlewareWrapper(sessionMiddleware))
  io.use(socketMiddlewareWrapper(passport.initialize()))
  io.use(socketMiddlewareWrapper(passport.session()))
  io.use(socketMiddlewareWrapper(isAuthenticated))

  io.on("connection", (socket) => {
    console.log(`new connection: ${socket.request.user.email}`)
    socket.join(socket.request.session.id) // for disconnecting while logging out

    socket.on("disconnecting", () => console.log("disconnecting"))
    socket.on("disconnect", () => console.log("disconnected"))
  })

  return httpServer
}
