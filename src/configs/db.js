import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"

const queryClient = postgres(process.env.DATABASE_POOL_URL, {
  ssl: "require",
  debug: Boolean(process.env.DEBUG || false),
})
const db = drizzle(queryClient)

export default db
