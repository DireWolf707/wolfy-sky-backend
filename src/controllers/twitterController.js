import { catchAsync } from "../utils"
import { db, storage } from "../configs"
import { userT, followT, tweetT, likeT, notificationT, tweetSchema, arrayAggOrder, arrayAgg, alias, commentTweetT } from "../drizzle/schema"
import { eq, ne, ilike, and, sql, desc } from "drizzle-orm"
import { mediaInput } from "../validators"
import { io } from "../socket"

export const getFeed = catchAsync(async (req, res) => {
  const { id } = req.user

  const parentTweetT = alias(tweetT, "ParentTweet")
  const parentTweetUserT = alias(tweetT, "ParentTweetUser")
  const feed = await db
    .select({
      ...tweetT,
      user: userT,
      isLiked: likeT,
      parentTweet: {
        ...parentTweetT,
        user: parentTweetUserT,
      },
    })
    .from(followT)
    .innerJoin(tweetT, and(eq(id, followT.from), eq(followT.to, tweetT.userId)))
    .leftJoin(userT, eq(tweetT.userId, userT.id))
    .leftJoin(parentTweetT, eq(tweetT.parentTweetId, parentTweetT.id))
    .leftJoin(parentTweetUserT, eq(parentTweetT.userId, parentTweetUserT.id))
    .leftJoin(likeT, and(eq(tweetT.id, likeT.tweetId), eq(likeT.userId, id)))
    .orderBy(desc(tweetT.createdAt))

  res.json({ data: feed })
})

export const getFollowRecomendations = catchAsync(async (req, res) => {
  const { id } = req.user

  const f2fT = alias(followT, "followingToFollowing")
  const whoToFollow = await db
    .select({ ...userT })
    .from(followT)
    .innerJoin(f2fT, and(eq(id, followT.from), eq(followT.to, f2fT.from), ne(f2fT.to, id)))
    .leftJoin(userT, eq(f2fT.to, userT.id))
    .groupBy(userT.id, f2fT.createdAt) // to get distinct users
    .orderBy(desc(f2fT.createdAt))
    .limit(4)

  res.json({ data: whoToFollow })
})

export const getTweet = catchAsync(async (req, res) => {
  const { id } = req.user
  const { tweetId } = req.params

  const [tweet] = await db
    .select({ ...tweetT, user: userT, isLiked: likeT })
    .from(tweetT)
    .innerJoin(userT, and(eq(tweetId, tweetT.id), eq(tweetT.userId, userT.id)))
    .leftJoin(likeT, and(eq(tweetT.id, likeT.tweetId), eq(likeT.userId, id)))

  res.json({ data: tweet })
})

export const getComments = catchAsync(async (req, res) => {
  const { id } = req.user
  const { tweetId } = req.params

  const comments = await db
    .select({ ...tweetT, user: userT, isLiked: likeT })
    .from(tweetT)
    .innerJoin(userT, and(eq(tweetId, tweetT.parentTweetId), eq(tweetT.userId, userT.id)))
    .leftJoin(likeT, and(eq(tweetT.id, likeT.tweetId), eq(likeT.userId, id)))
    .orderBy(desc(tweetT.createdAt))

  res.json({ data: comments })
})

export const getPublicProfile = catchAsync(async (req, res) => {
  const { id } = req.user
  const { userId } = req.params

  const userQ = db
    .select({
      ...userT,
      followers: sql`(select count(*) from ${followT} where ${followT.to} = ${userId})`,
      following: sql`(select count(*) from ${followT} where ${followT.from} = ${userId})`,
      isFollowed: sql`(select count(*) from ${followT} where ${followT.from} = ${id} and ${followT.to} = ${userId})`,
    })
    .from(userT)
    .where(eq(userId, userT.id))

  const tweetsQ = db
    .select({
      ...tweetT,
      user: userT,
      isLiked: likeT,
    })
    .from(tweetT)
    .innerJoin(userT, and(eq(userId, tweetT.userId), eq(tweetT.userId, userT.id)))
    .leftJoin(likeT, and(eq(tweetT.id, likeT.tweetId), eq(likeT.userId, id)))
    .orderBy(desc(tweetT.createdAt))

  const [[user], tweets] = await Promise.all([userQ, tweetsQ])

  res.json({ data: { ...user, tweets } })
})

export const getNotifications = catchAsync(async (req, res) => {
  const { id } = req.user

  const notifications = await db
    .select({
      ...notificationT,
      user: userT,
    })
    .from(notificationT)
    .innerJoin(userT, and(eq(id, notificationT.to), eq(notificationT.from, userT.id)))
    .orderBy(desc(notificationT.createdAt))

  res.json({ data: notifications })
})

export const search = catchAsync(async (req, res) => {
  const { id } = req.user
  const { q } = req.query

  const userSq = db
    .select()
    .from(userT)
    .where(and(ne(userT.id, id), ilike(userT.username, `%${q}%`)))
    .as("user")

  const result = await db
    .select()
    .from(userSq)
    .leftJoin(followT, and(eq(id, followT.from), eq(followT.to, userSq.id)))

  res.json({ data: result })
})

export const createTweet = catchAsync(async (req, res) => {
  const { id } = req.user

  const data = tweetSchema.parse({ ...req.body, userId: id })
  const [tweet] = await db.insert(tweetT).values(data).returning()

  res.json({ data: tweet })
})

export const like = catchAsync(async (req, res) => {
  const { id } = req.user
  const { tweetId } = req.params

  await db.insert(likeT).values({ userId: id, tweetId })

  res.end()
})

export const unlike = catchAsync(async (req, res) => {
  const { id } = req.user
  const { tweetId } = req.params

  await db.delete(likeT).where(and(eq(likeT.userId, id), eq(likeT.tweetId, tweetId)))

  res.end()
})

export const follow = catchAsync(async (req, res) => {
  const { id } = req.user
  const { userId } = req.params

  await db.insert(followT).values({ to: userId, from: id })

  res.end()
})

export const unfollow = catchAsync(async (req, res) => {
  const { id } = req.user
  const { userId } = req.params

  await db.delete(followT).where(and(eq(followT.to, userId), eq(followT.from, id)))

  res.end()
})
