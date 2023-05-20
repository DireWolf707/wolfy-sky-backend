import { Storage } from "@google-cloud/storage"

const gcsStorageClient = new Storage({ credentials: JSON.parse(process.env.GCS_CREDENTIALS) })
const gcsBucket = gcsStorageClient.bucket(process.env.GCS_BUCKET)

export default {
  upload: async (filename, buffer) => {
    const file = gcsBucket.file(filename)
    await file.save(buffer)
    await file.makePublic()

    return file.publicUrl()
  },

  delete: async (filename) => {
    const file = gcsBucket.file(filename)
    await file.delete({ ignoreNotFound: true })
  },
}
