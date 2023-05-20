import "../configs/dotenv"

export default {
  schema: "src/drizzle/schema.js",
  out: "src/drizzle/migrations",
  connectionString: process.env.DATABASE_DIRECT_URL, // for future when pg push is available
}
