import { catchAsync } from "../utils"
import { db, storage } from "../configs"
import {
  userT,
  followT,
  tweetT,
  likeT,
  notificationT,
  tweetSchema,
  arrayAgg,
  ilike,
  eq,
  sql,
  alias,
  ne,
  and,
  desc,
} from "../drizzle/schema"
import { mediaInput } from "../validators"
import { io } from "../socket"

export const getFeed = catchAsync(async (req, res) => {
  const { id } = req.user

  const parentTweetT = alias(tweetT, "parentTweetT")
  const feed = await db
    .select({
      user: userT,
      tweet: tweetT,
      parentTweet: parentTweetT,
    })
    .from(followT)
    .where(eq(followT.from, id))
    .leftJoin(tweetT, eq(followT.to, tweetT.userId))
    .leftJoin(parentTweetT, eq(tweetT.parentTweetId, parentTweetT.id))
    .leftJoin(userT, eq(tweetT.userId, userT.id))
    .orderBy(desc(tweetT.createdAt))

  res.json({ data: feed })
})

export const getFollowRecomendations = catchAsync(async (req, res) => {
  const { id } = req.user

  const followingOfFollowingT = alias(followT, "followingOfFollowing")
  const whoToFollow = await db
    .select({ ...userT })
    .from(followT)
    .where(eq(followT.from, id))
    .leftJoin(followingOfFollowingT, eq(followT.to, followingOfFollowingT.from))
    .leftJoin(userT, eq(followingOfFollowingT.to, userT.id))
    .groupBy(userT.id) // to get distinct values
    .limit(4)

  res.json({ data: whoToFollow })
})

export const getTweet = catchAsync(async (req, res) => {
  const { tweetId } = req.params

  const commentT = alias(tweetT, "commentT")
  const [tweet] = await db
    .select({
      ...tweetT,
      comments: arrayAgg(commentT, commentT.id),
    })
    .from(tweetT)
    .where(eq(tweetT.id, tweetId))
    .leftJoin(commentT, eq(tweetT.id, commentT.parentTweetId))
    .groupBy(tweetT.id)
    .orderBy(desc(commentT.createdAt))

  // TODO: include tweet user and comments user

  res.json({ data: tweet })
})

export const getPublicProfile = catchAsync(async (req, res) => {
  const { userId } = req.params

  const [profile] = await db
    .select({
      user: userT,
      tweets: arrayAgg(tweetT, tweetT.id),
      followers: sql`(select count(*) from ${followT} where ${followT.to} = ${userId})`,
      following: sql`(select count(*) from ${followT} where ${followT.from} = ${userId})`,
    })
    .from(userT)
    .where(eq(userT.id, userId))
    .leftJoin(tweetT, eq(userT.id, tweetT.userId))
    .groupBy(userT.id)
    .orderBy(desc(tweetT.createdAt))

  res.json({ data: profile })
})

export const getNotifications = catchAsync(async (req, res) => {
  const { id } = req.user

  const notifications = await db
    .select()
    .from(notificationT)
    .where(eq(notificationT.to, id))
    .leftJoin(userT, eq(notificationT.from, userT.id))
    .orderBy(desc(notificationT.createdAt))

  res.json({ data: notifications })
})

export const search = catchAsync(async (req, res) => {
  const { id } = req.user
  const { q } = req.query

  const result = await db
    .select()
    .from(userT)
    .where(and(ne(userT.id, id), ilike(userT.username, `%${q}%`)))

  res.json({ data: result })
})

export const createTweet = catchAsync(async (req, res) => {
  const { id } = req.user
  const { tweetId = null } = req.params

  const data = tweetSchema.parse(req.body)

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
