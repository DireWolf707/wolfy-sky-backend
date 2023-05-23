import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import * as schema from "../drizzle/schema"

const queryClient = postgres(process.env.DATABASE_POOL_URL, {
  ssl: "require",
  debug: Boolean(process.env.DEBUG || false),
})

const db = drizzle(queryClient, { schema })

export default db
