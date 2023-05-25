import { AppError } from "../utils"

const imageMimeTypes = ["image/jpeg", "image/png"]
export const imageInput = (image) => {
  if (!image) throw new AppError("no image file uploaded")
  if (!imageMimeTypes.includes(image.mimetype)) throw new AppError("only .jpg, .jpeg and .png formats are supported")
  return image
}

export const mediaInput = (media) => {
  if (!media) throw new AppError("no media file uploaded")
  if (imageMimeTypes.includes(media.mimetype)) return [media, "img"]
  if (media.mimetype.startsWith("video/")) return [media, "vid"]

  throw new AppError("un-supported media file uploaded")
}
