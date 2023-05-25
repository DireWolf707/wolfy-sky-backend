import passport from "passport"
import db from "./db"
import { Strategy as GoogleStrategy } from "passport-google-oauth20"
import { userT, userSchema } from "../drizzle/schema"
import { eq } from "drizzle-orm"
import { randomString, slugify } from "../utils"

passport.use(
  new GoogleStrategy(
    {
      clientID: String(process.env.GOOGLE_CLIENT_ID),
      clientSecret: String(process.env.GOOGLE_CLIENT_SECRET),
      callbackURL: `${process.env.RENDER_EXTERNAL_URL || process.env.SERVER_URL}${process.env.GOOGLE_CALLBACK}`,
      scope: ["email", "profile"],
    },
    async (accessToken, refreshToken, profile, cb) => {
      const { email, given_name: name } = profile._json

      try {
        let [user] = await db.select().from(userT).where(eq(userT.email, email))
        if (!user) {
          const data = userSchema.parse({ email, name, username: slugify(`${name} ${randomString()}`) })
          user = (await db.insert(userT).values(data).returning())[0]
        }
        cb(null, user)
      } catch (err) {
        cb(err, null)
      }
    }
  )
)

passport.serializeUser((user, done) => done(null, user))

passport.deserializeUser((user, done) => done(null, user))
