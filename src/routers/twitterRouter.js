import express from "express"
import {
  getFeed,
  getNotifications,
  getPublicProfile,
  getTweet,
  getComments,
  search,
  createTweet,
  like,
  unlike,
  follow,
  unfollow,
  getFollowRecomendations,
} from "../controllers/twitterController"
import { isAuthenticated } from "../middlewares/auth"

const router = express.Router()
router.use(isAuthenticated)

router.get("/feed", getFeed)
router.get("/search", search)
router.get("/notifications", getNotifications)
router.get("/recomendations", getFollowRecomendations)
router.get("/profile/:userId", getPublicProfile)
router.route("/profile/:userId/follow").post(follow).delete(unfollow)
router.post("/tweet", createTweet)
router.get("/tweet/:tweetId", getTweet)
router.get("/tweet/:tweetId/comments", getComments)
router.route("/tweet/:tweetId/like").post(like).delete(unlike)

export default router
