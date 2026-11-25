import { resolve } from 'node:path'
import { logger } from '@nuxt/kit'
import type { Nuxt } from '@nuxt/schema'
import { uploadBuildOutputToS3 } from '../upload/s3'
import type { NuxtConfModuleOptions } from '../types'

/** Options for registering the production S3 upload hook. */
export interface RegisterUploadHookOptions {
  environment: string
  upload: NonNullable<NuxtConfModuleOptions['upload']>
  rootDir: string
  versionFileName: string
}

/** Registers the upload hook after Nitro writes its production output. */
export const registerUploadHook = (
  nuxt: Nuxt,
  {
    environment,
    upload,
    rootDir,
    versionFileName,
  }: RegisterUploadHookOptions,
) => {
  if (!upload.enabled || nuxt.options.dev) {
    return
  }

  nuxt.hook('nitro:init', (nitro) => {
    nitro.hooks.hookOnce('compiled', async () => {
      const outputDir = upload.outputDir
        ? resolve(rootDir, upload.outputDir)
        : nitro.options.output.publicDir

      logger.start(`[nuxt-conf] Uploading S3 static assets [${environment}]`)

      try {
        await uploadBuildOutputToS3({
          rootDir,
          environment,
          upload,
          outputDir,
          versionFileName,
        })
        logger.success(`[nuxt-conf] S3 static assets uploaded [${environment}]`)
      }
      catch (error) {
        logger.error('[nuxt-conf] S3 static asset upload failed:', error)
        throw error
      }
    })
  })
}
