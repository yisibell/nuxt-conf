import { resolve } from 'node:path'
import { logger } from '@nuxt/kit'
import type { Nuxt } from '@nuxt/schema'
import { uploadBuildOutput } from '../upload/s3'
import type { NuxtConfModuleOptions } from '../types'

/** Options for registering the production S3 upload hook. */
export interface RegisterUploadHookOptions {
  environment: string
  upload: NonNullable<NuxtConfModuleOptions['upload']>
  rootDir: string
  outputDir: string
  versionFileName: string
}

/** Registers the post-build hook that uploads generated public assets. */
export const registerUploadHook = (
  nuxt: Nuxt,
  {
    environment,
    upload,
    rootDir,
    outputDir,
    versionFileName,
  }: RegisterUploadHookOptions,
) => {
  if (!upload.enabled || nuxt.options.dev) {
    return
  }

  nuxt.hook('build:done', async () => {
    logger.start(`[nuxt-conf] Uploading S3 static assets [${environment}]`)

    try {
      await uploadBuildOutput({
        rootDir,
        environment,
        upload,
        outputDir: outputDir || resolve(rootDir, upload.outputDir ?? '.output/public'),
        versionFileName,
      })
      logger.success(`[nuxt-conf] S3 static assets uploaded [${environment}]`)
    }
    catch (error) {
      logger.error('[nuxt-conf] S3 static asset upload failed:', error)
      throw error
    }
  })
}
