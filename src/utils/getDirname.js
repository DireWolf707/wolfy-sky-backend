import path from "path"
import { fileURLToPath } from "url"

export default (url) => path.dirname(fileURLToPath(url))
