export * from "./operators"
import { pgTable, text, timestamp, uniqueIndex, index, uuid, varchar, primaryKey } from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"

export const userT = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 256 }).notNull(),
    name: varchar("name", { length: 256 }).notNull(),
    username: varchar("username", { length: 256 }).notNull(),
    avatar: varchar("avatar", { length: 256 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (userT) => ({
    usernameIdx: uniqueIndex("username_idx").on(userT.username),
    emailIdx: uniqueIndex("email_idx").on(userT.email),
  })
)

export const userSchema = createInsertSchema(userT)

export const tweetT = pgTable(
  "tweets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    content: text("content").notNull(),
    mediaURL: varchar("media_url", { length: 256 }),
    mediaType: varchar("media_type", { length: 12, enum: ["img", "vid"] }),
    userId: uuid("user_id")
      .notNull()
      .references(() => userT.id),
    parentTweetId: uuid("parent_tweet_id").references(() => tweetT.id),
  },
  (tweetT) => ({
    userIdx: index("user_idx").on(tweetT.userId),
    parentTweetIdx: index("parent_tweet_idx").on(tweetT.parentTweetId),
  })
)

export const tweetSchema = createInsertSchema(tweetT)

export const notificationT = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: varchar("type", { length: 12, enum: ["like", "comment", "follow"] }).notNull(),
    to: uuid("to")
      .notNull()
      .references(() => userT.id),
    from: uuid("from")
      .notNull()
      .references(() => userT.id),
    tweetId: uuid("tweet_id").references(() => tweetT.id),
  },
  (notificationT) => ({
    userIdx: index("user_idx").on(notificationT.to),
  })
)

export const followT = pgTable(
  "follows",
  {
    to: uuid("to")
      .notNull()
      .references(() => userT.id),
    from: uuid("from")
      .notNull()
      .references(() => userT.id),
  },
  (followT) => ({
    pk: primaryKey(followT.to, followT.from),
  })
)
