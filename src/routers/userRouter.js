import express from "express"
import passport from "passport"
import { getProfile, updateProfile, updateAvatar, deleteAvatar, logout } from "../controllers/userController"
import { isAuthenticated } from "../middlewares/auth"

const router = express.Router()
router.get("/login/google", passport.authenticate("google"))
router.get(
  "/oauth2/redirect/google",
  passport.authenticate("google", {
    successRedirect: process.env.CLIENT_URL,
    failureRedirect: process.env.CLIENT_URL + "/500",
  })
)
router.post("/logout", isAuthenticated, logout)
router.get("/me", getProfile)
router.post("/profile", isAuthenticated, updateProfile)
router.route("/avatar").post(isAuthenticated, updateAvatar).delete(isAuthenticated, deleteAvatar)

export default router
