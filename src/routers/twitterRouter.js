import express from "express"
import { getFeed, getNotifications, getPublicProfile, getTweet, tweet, like, unlike } from "../controllers/twitterController"
import { isAuthenticated } from "../middlewares/auth"

const router = express.Router()
router.use(isAuthenticated)

router.get("/feed", getFeed)
router.get("/notifications", getNotifications)
router.get("/public-profile/:userId", getPublicProfile)
router.post("/tweet", tweet)
router.get("/tweet/:tweetId", getTweet)
router.route("/tweet/:tweetId/like").post(like).delete(unlike)

export default router
