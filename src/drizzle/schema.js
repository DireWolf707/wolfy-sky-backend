export * from "./operators"
import { relations } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"
import { pgTable, text, timestamp, uniqueIndex, index, uuid, varchar, primaryKey, foreignKey } from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"

export const userT = pgTable(
  "User",
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

export const userRelations = relations(userT, ({ one, many }) => ({
  tweets: many(tweetT),
}))

export const userSchema = createInsertSchema(userT)

export const tweetT = pgTable(
  "Tweet",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    content: text("content").notNull(),
    mediaURL: varchar("media_url", { length: 256 }),
    mediaType: varchar("media_type", { length: 12, enum: ["img", "vid"] }),
    userId: uuid("user_id")
      .notNull()
      .references(() => userT.id),
    parentTweetId: uuid("parent_tweet_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (tweetT) => ({
    parentTweetRef: foreignKey({
      columns: [tweetT.parentTweetId],
      foreignColumns: [tweetT.id],
    }).onDelete("cascade"),
    userIdx: index("user_idx").on(tweetT.userId),
    parentTweetIdx: index("parent_tweet_idx").on(tweetT.parentTweetId),
  })
)

export const tweetSchema = createInsertSchema(tweetT)

export const tweetRelations = relations(tweetT, ({ one, many }) => ({
  user: one(userT, {
    fields: [tweetT.userId],
    references: [userT.id],
  }),
  comments: many(commentTweetT),
  isLiked: many(likeT),
}))

export const commentTweetT = alias(tweetT, "commentTweetT")

export const commentTweetRelations = relations(commentTweetT, ({ one, many }) => ({
  user: one(userT, {
    fields: [commentTweetT.userId],
    references: [userT.id],
  }),
  parentTweet: one(tweetT, {
    fields: [commentTweetT.parentTweetId],
    references: [tweetT.id],
  }),
}))

export const notificationT = pgTable(
  "Notification",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: varchar("type", { length: 12, enum: ["like", "comment", "follow"] }).notNull(),
    to: uuid("to")
      .notNull()
      .references(() => userT.id),
    from: uuid("from")
      .notNull()
      .references(() => userT.id),
    tweetId: uuid("tweet_id").references(() => tweetT.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (notificationT) => ({
    userIdx: index("user_idx").on(notificationT.to),
  })
)

export const followT = pgTable(
  "Follow",
  {
    to: uuid("to")
      .notNull()
      .references(() => userT.id),
    from: uuid("from")
      .notNull()
      .references(() => userT.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (followT) => ({
    pk: primaryKey(followT.to, followT.from),
  })
)

export const likeT = pgTable(
  "Like",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => userT.id),
    tweetId: uuid("tweet_id")
      .notNull()
      .references(() => tweetT.id, { onDelete: "cascade" })
  },
  (likeT) => ({
    pk: primaryKey(likeT.userId, likeT.tweetId),
  })
)

export const likeRelations = relations(likeT, ({ one, many }) => ({
  tweet: one(tweetT, {
    fields: [likeT.tweetId],
    references: [tweetT.id],
  }),
}))
