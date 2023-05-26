import passport from "passport"
import { Server } from "socket.io"
import { sessionMiddleware, socketMiddlewareWrapper, corsOptions } from "./middlewares/global"
import { isAuthenticated } from "./middlewares/auth"
import { redis } from "./configs"
import { roomKey } from "./utils"

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
    socket.join(roomKey("user", socket.request.user.id)) // for notifications

    socket.on("sub_tweet", async ({ tweetId }, cb) => {
      const key = roomKey("tweet", tweetId)
      const metadata = await redis.hGetAll(key)
      socket.join(key)
      cb(metadata)
    })

    socket.on("unsub_tweet", ({ tweetId }) => socket.leave(roomKey("tweet", tweetId)))

    socket.on("disconnecting", () => console.log("disconnecting"))
    socket.on("disconnect", () => console.log("disconnected"))
  })

  return httpServer
}
