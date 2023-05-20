export * from "./operators"
import { pgTable, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"

export const userT = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 256 }).notNull(),
    name: varchar("name", { length: 256 }).notNull(),
    username: varchar("username", { length: 256 }).notNull(),
    avatar: varchar("avatar", { length: 256 }),
  },
  (users) => ({
    usernameIndex: uniqueIndex("username_idx").on(users.username),
    emailIndex: uniqueIndex("email_idx").on(users.email),
  })
)

export const userSchema = createInsertSchema(userT)
