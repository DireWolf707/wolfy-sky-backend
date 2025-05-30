import { catchAsync, roomKey } from "../utils"
import { db, redis, storage } from "../configs"
import { userT, followT, tweetT, likeT, notificationT, tweetSchema, alias, except, union } from "../drizzle/schema"
import { eq, ne, ilike, and, sql, desc } from "drizzle-orm"
import { mediaInput } from "../validators"
import { io } from "../socket"
import { v4 as uuid } from "uuid"

export const getFeed = catchAsync(async (req, res) => {
  const { id } = req.user

  const parentTweetT = alias(tweetT, "ParentTweet")
  const parentTweetUserT = alias(userT, "ParentTweetUser")
  const parentTweetLikeT = alias(likeT, "ParentTweetLike")

  const myTweet = db
    .select({ ...tweetT })
    .from(tweetT)
    .where(eq(tweetT.userId, id))

  const followingTweet = db
    .select({ ...tweetT })
    .from(followT)
    .innerJoin(tweetT, and(eq(followT.from, id), eq(followT.to, tweetT.userId)))

  const combinedTweet = union(myTweet, followingTweet).as("Tweet")

  const feed = await db
    .select({
      tweet: { ...tweetT, user: userT },
      isTweetLiked: likeT,
      parentTweet: { ...parentTweetT, user: parentTweetUserT },
      isParentTweetLiked: parentTweetLikeT,
    })
    .from(combinedTweet)
    .leftJoin(userT, eq(combinedTweet.userId, userT.id))
    .leftJoin(likeT, and(eq(combinedTweet.id, likeT.tweetId), eq(likeT.userId, id)))
    .leftJoin(parentTweetT, eq(combinedTweet.parentTweetId, parentTweetT.id)) // parent tweet of only non-self tweets
    .leftJoin(parentTweetUserT, eq(parentTweetT.userId, parentTweetUserT.id))
    .leftJoin(parentTweetLikeT, and(eq(parentTweetT.id, parentTweetLikeT.tweetId), eq(parentTweetLikeT.userId, id)))
    .orderBy(desc(combinedTweet.createdAt))

  res.json({ data: feed })
})

export const getFollowRecomendations = catchAsync(async (req, res) => {
  const { id } = req.user

  const following = db
    .select({ to: followT.to })
    .from(followT)
    .where(eq(followT.from, id))

  const f2fT = alias(followT, "followingOfFollowing")
  const followingOfFollowing = db
    .select({ to: f2fT.to })
    .from(followT)
    .innerJoin(f2fT, and(eq(followT.from, id), eq(followT.to, f2fT.from), ne(f2fT.to, id)))

  const filteredFollowingOfFollowing = except(followingOfFollowing, following).as("filteredFollowingOfFollowing")

  const followRecomendations = await db
    .select({ ...userT })
    .from(filteredFollowingOfFollowing)
    .leftJoin(userT, eq(filteredFollowingOfFollowing.to, userT.id))

  res.json({ data: followRecomendations })
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
    .select({ tweet: { ...tweetT, user: userT }, isTweetLiked: likeT })
    .from(tweetT)
    .innerJoin(userT, and(eq(tweetId, tweetT.parentTweetId), eq(tweetT.userId, userT.id)))
    .leftJoin(likeT, and(eq(tweetT.id, likeT.tweetId), eq(likeT.userId, id)))
    .orderBy(desc(tweetT.createdAt))

  res.json({ data: comments })
})

export const getPublicProfile = catchAsync(async (req, res) => {
  const { id } = req.user
  const { userId } = req.params

  const parentTweetT = alias(tweetT, "ParentTweet")
  const parentTweetUserT = alias(userT, "ParentTweetUser")
  const parentTweetLikeT = alias(likeT, "ParentTweetLike")

  const userQ = db
    .select({
      ...userT,
      followers: sql`(select count(*) from ${followT} where ${followT.to} = ${userId})`,
      following: sql`(select count(*) from ${followT} where ${followT.from} = ${userId})`,
      isFollowed: sql`(select count(*) from ${followT} where ${followT.from} = ${id} and ${followT.to} = ${userId})`,
    })
    .from(userT)
    .where(eq(userId, userT.id))

  const myTweet = db
    .select({ ...tweetT })
    .from(tweetT)
    .where(eq(tweetT.userId, userId))
    .as("Tweet")

  const tweetsQ = db
    .select({
      tweet: { ...tweetT, user: userT },
      isTweetLiked: likeT,
      parentTweet: { ...parentTweetT, user: parentTweetUserT },
      isParentTweetLiked: parentTweetLikeT,
    })
    .from(myTweet)
    .leftJoin(userT, eq(myTweet.userId, userT.id)) // redundant
    .leftJoin(likeT, and(eq(myTweet.id, likeT.tweetId), eq(likeT.userId, id)))
    .leftJoin(parentTweetT, eq(myTweet.parentTweetId, parentTweetT.id))
    .leftJoin(parentTweetUserT, eq(parentTweetT.userId, parentTweetUserT.id))
    .leftJoin(parentTweetLikeT, and(eq(parentTweetT.id, parentTweetLikeT.tweetId), eq(parentTweetLikeT.userId, id)))
    .orderBy(desc(myTweet.createdAt))

  const [[profile], tweets] = await Promise.all([userQ, tweetsQ])

  res.json({ data: { profile, tweets } })
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
  const { parentTweetId } = req.body
  // check and upload media if exist
  if (req?.files?.media) {
    const [media, mediaType] = mediaInput(req.files.media)
    const mediaURL = await storage.upload(uuid(), media.data)
    req.body.mediaType = mediaType
    req.body.mediaURL = mediaURL
  }
  // check and create tweet
  const data = tweetSchema.parse({ ...req.body, userId: id })
  const [tweet] = await db.insert(tweetT).values(data).returning()
  // create redis cache
  await redis.hSet(roomKey("tweet", tweet.id), { likes: 0, comments: 0 })
  // check if its a reply tweet
  if (parentTweetId) {
    // update and emit comment count
    const key = roomKey("tweet", parentTweetId)
    const comments = await redis.hIncrBy(key, "comments", 1)
    io.in(key).emit(roomKey(key, "comments"), comments)
    // get parent tweet
    db.select()
      .from(tweetT)
      .where(eq(parentTweetId, tweetT.id))
      .then(([tweet]) => {
        // don't send notification if self reply
        if (tweet.userId === id) return
        // create and send notification
        db.insert(notificationT)
          .values({
            type: "comment",
            to: tweet.userId,
            from: id,
            tweetId: tweet.id,
          })
          .then(() => io.in(roomKey("user", tweet.userId)).emit("new_notification"))
      })
  }

  res.json({ data: { ...tweet, user: req.user } })
})

export const like = catchAsync(async (req, res) => {
  const { id } = req.user
  const { tweetId } = req.params
  // create like
  await db.insert(likeT).values({ userId: id, tweetId })
  // update and emit like count
  const key = roomKey("tweet", tweetId)
  const likes = await redis.hIncrBy(key, "likes", 1)
  io.in(key).emit(roomKey(key, "likes"), likes)
  // get tweet
  db.select()
    .from(tweetT)
    .where(eq(tweetId, tweetT.id))
    .then(([tweet]) => {
      // don't send notification if self like
      if (tweet.userId === id) return
      // create and send notification
      db.insert(notificationT)
        .values({
          type: "like",
          to: tweet.userId,
          from: id,
          tweetId: tweet.id,
        })
        .then(() => io.in(roomKey("user", tweet.userId)).emit("new_notification"))
    })

  res.end()
})

export const unlike = catchAsync(async (req, res) => {
  const { id } = req.user
  const { tweetId } = req.params
  // delete unlike
  const [unlike] = await db
    .delete(likeT)
    .where(and(eq(likeT.userId, id), eq(likeT.tweetId, tweetId)))
    .returning()
  // if unlike successful
  if (unlike) {
    // update and emit like count
    const key = roomKey("tweet", tweetId)
    const likes = await redis.hIncrBy(key, "likes", -1)
    io.in(key).emit(roomKey(key, "likes"), likes)
    // remove notification
    await db
      .delete(notificationT)
      .where(and(
        eq(notificationT.type, "like"),
        eq(notificationT.from, id),
        eq(notificationT.tweetId, unlike.tweetId)
      ))
  }

  res.end()
})

export const follow = catchAsync(async (req, res) => {
  const { id } = req.user
  const { userId } = req.params
  // check for self follow
  if (id === userId) return res.status(400).end()
  // create follow
  await db.insert(followT).values({ to: userId, from: id })
  // create and send notification
  db.insert(notificationT)
    .values({
      type: "follow",
      to: userId,
      from: id,
    })
    .then(() => io.in(roomKey("user", userId)).emit("new_notification"))

  res.end()
})

export const unfollow = catchAsync(async (req, res) => {
  const { id } = req.user
  const { userId } = req.params
  // check for self follow
  if (id === userId) return res.status(400).end()
  // delete follow
  const [unfollow] = await db.delete(followT).where(and(eq(followT.to, userId), eq(followT.from, id))).returning()
  // if unfollow successful
  if (unfollow) {
    // remove notification
    await db
      .delete(notificationT)
      .where(and(
        eq(notificationT.type, "follow"),
        eq(notificationT.from, id),
        eq(notificationT.to, unfollow.to),
      ))
  }

  res.end()
})
