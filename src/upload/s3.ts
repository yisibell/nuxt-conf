import { uploadToS3 } from '../runtime/upload/s3'
import type { NuxtConfUploadOptions } from '../types'

interface UploadBuildContext {
  rootDir: string
  environment: string
  upload: NuxtConfUploadOptions
  outputDir: string
  versionFileName: string
}

/** Uploads the versioned public assets with Nuxt's S3 defaults. */
export async function uploadBuildOutputToS3({
  rootDir,
  environment,
  upload,
  outputDir,
  versionFileName,
}: UploadBuildContext): Promise<void> {
  await uploadToS3({
    rootDir,
    environment,
    sourceDir: outputDir,
    configFile: upload.configFile,
    versionFileName,
    keyPrefix: upload.keyPrefix ?? 'nuxt/pc',
    concurrency: upload.concurrency,
    reporter: upload.reporter,
    publish: {
      headers: {
        'Cache-Control': 'max-age=315360000, public',
        'x-amz-acl': 'public-read',
        ...upload.publish?.headers,
      },
      options: {
        force: true,
        ...upload.publish?.options,
      },
    },
  })
}
