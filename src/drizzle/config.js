import "../configs/dotenv"

export default {
  schema: "src/drizzle/schema.js",
  out: "src/drizzle/migrations",
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_DIRECT_URL,
  }
}
