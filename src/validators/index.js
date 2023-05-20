import { AppError } from "../utils"

const imageMimeTypes = ["image/jpeg", "image/png"]
export const imageInput = (image) => {
  if (!image) throw new AppError("no image file uploaded")
  if (!imageMimeTypes.includes(image.mimetype)) throw new AppError("Only .jpg, .jpeg and .png formats are supported")
  return image
}
