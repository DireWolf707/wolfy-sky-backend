import { catchAsync, slugify } from "../utils"
import { db, storage } from "../configs"
import { userT, userSchema } from "../drizzle/schema"
import { eq } from "drizzle-orm"
import { imageInput } from "../validators"
import { sessionOptions } from "../middlewares/global"
import { io } from "../socket"

export const getProfile = (req, res) => res.json({ data: req?.user || null })

export const updateProfile = catchAsync(async (req, res) => {
  const { id, email } = req.user
  const { username } = req.body

  req.body.email = email
  if (username) req.body.username = slugify(username)
  // validate input
  const data = userSchema.parse(req.body)
  // update user
  const [user] = await db.update(userT).set(data).where(eq(userT.id, id)).returning()
  // update session
  req.session.passport.user = user

  res.json({ data: user })
})

export const updateAvatar = catchAsync(async (req, res) => {
  const { id, avatar } = req.user

  // validate image
  const image = imageInput(req?.files?.file)
  // upload new avatar (write/re-write)
  const filename = `avatars/${id}`
  const avatarURL = await storage.upload(filename, image.data)
  // update user
  const [user] = await db.update(userT).set({ avatar: avatarURL }).where(eq(userT.id, id)).returning()
  // update session (write)
  if (!avatar) req.session.passport.user = user

  res.json({ data: user })
})

export const deleteAvatar = catchAsync(async (req, res) => {
  const { id, avatar } = req.user

  if (avatar) {
    // remove avatar
    const filename = `avatars/${id}`
    await storage.delete(filename)
    // update user
    const [user] = await db.update(userT).set({ avatar: null }).where(eq(userT.id, id)).returning()
    // update session
    req.session.passport.user = user
  }

  res.json({ data: req.session.passport.user })
})

export const logout = (req, res) => {
  const sessionId = req.session.id

  req.session.destroy(() => {
    io.in(sessionId).disconnectSockets()
    res.clearCookie(sessionOptions.name)
    res.json({ data: null })
  })
}
