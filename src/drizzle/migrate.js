import "../configs/dotenv"
import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"

const db = postgres(process.env.DATABASE_DIRECT_URL, { ssl: "require" })

await migrate(drizzle(db), { migrationsFolder: "src/drizzle/migrations" })

process.exit(0)
