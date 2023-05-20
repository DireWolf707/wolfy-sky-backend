import dotenv from "dotenv"
import path from "path"
import { getDirname } from "../utils"

const dirname = getDirname(import.meta.url)

const getDotenvPath = () => {
  switch (process.env.NODE_ENV) {
    case "production":
      return "/etc/secrets/.env"

    default:
      return path.join(dirname, "../../.env")
  }
}

dotenv.config({
  path: getDotenvPath(),
})
