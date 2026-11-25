import { existsSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { Writable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { pathToFileURL } from 'node:url'
import gulp from 'gulp'
import awspublish from 'gulp-awspublish'
import rename from 'gulp-rename'
import { loadVersionFile } from '../version'
import type { NuxtConfS3Config, S3ConfiguredUploadOptions, S3UploadOptions, S3UploadState } from './types'

export type { NuxtConfS3Config as S3EnvironmentConfig, S3ConfiguredUploadOptions, S3UploadOptions } from './types'

const defaultReporterStates: S3UploadState[] = [
  'create',
  'update',
  'put',
  'skip',
  'cache',
  'delete',
]

/**
 * Uploads the files in a local directory to S3, preserving their relative paths.
 *
 * Pass `region` and `bucket` to upload directly. The object keys are the file
 * paths relative to `sourceDir`, with `keyPrefix` prepended when provided.
 *
 * Pass `environment` to read a named entry from `awspublish.config.cjs` and the
 * version from `version.json`. Both paths resolve relative to `rootDir`, which
 * defaults to the current working directory. Object keys include the environment
 * and version after the optional `keyPrefix`.
 *
 * @param options - Direct S3 settings or the settings for a named environment.
 * @returns A promise that resolves when all files have been processed. A disabled
 * environment resolves without processing any files.
 * @throws If the configuration or source directory is invalid, or if the upload
 * pipeline fails.
 *
 * @example
 * ```ts
 * import { uploadToS3 } from 'nuxt-conf/upload/s3'
 *
 * await uploadToS3({
 *   sourceDir: '.output/public',
 *   environment: 'production',
 *   keyPrefix: 'static',
 *   publish: { options: { simulate: true } },
 * })
 * ```
 */
export async function uploadToS3(options: S3UploadOptions | S3ConfiguredUploadOptions): Promise<void> {
  if (!('environment' in options)) {
    return uploadDirectoryToS3(options)
  }

  const { rootDir = process.cwd(), environment, configFile = 'awspublish.config.cjs', versionFileName = 'version.json' } = options
  const configPath = resolve(rootDir, configFile)
  if (!existsSync(configPath)) {
    throw new Error(`S3 configuration file does not exist: ${configPath}`)
  }

  const imported = await import(pathToFileURL(configPath).href)
  const configs = imported.default ?? imported
  const config = configs && Object.hasOwn(configs, environment)
    ? configs[environment] as NuxtConfS3Config | undefined
    : undefined
  if (!config) {
    throw new Error(`Environment [${environment}] is missing from the S3 configuration file`)
  }

  if (!config.enabled) {
    return
  }

  const { version } = loadVersionFile(versionFileName, { rootDir })
  const credentials = config.accessKeyId && config.secretAccessKey
    ? { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey }
    : undefined

  await uploadDirectoryToS3({
    sourceDir: resolve(rootDir, options.sourceDir),
    region: config.region ?? '',
    bucket: config.bucket ?? '',
    credentials,
    keyPrefix: [options.keyPrefix, environment, version].filter(Boolean).join('/'),
    concurrency: options.concurrency,
    reporter: options.reporter,
    publish: options.publish,
  })
}

async function uploadDirectoryToS3({
  sourceDir,
  region,
  bucket,
  credentials,
  keyPrefix,
  concurrency,
  reporter,
  publish: publishConfig,
}: S3UploadOptions): Promise<void> {
  if (!region) {
    throw new Error('S3 region is not configured')
  }

  if (!bucket) {
    throw new Error('S3 bucket is not configured')
  }

  const directory = resolve(sourceDir)
  if (!statSync(directory, { throwIfNoEntry: false })?.isDirectory()) {
    throw new Error(`S3 upload source is not a directory: ${directory}`)
  }

  const publisher = awspublish.create({ region, params: { Bucket: bucket }, credentials })
  const { createTransformPool } = await import('object-transform-pool')
  const source = gulp.src('**/*', {
    cwd: directory,
    base: directory,
    encoding: false,
  })
  const rewriteKey = rename((filePath) => {
    if (keyPrefix) {
      filePath.dirname = `${keyPrefix}/${filePath.dirname}`
    }
  })
  const publish = createTransformPool(
    () => publisher.publish(publishConfig?.headers, publishConfig?.options),
    { concurrency },
  )
  const reporters = reporter === false
    ? []
    : [awspublish.reporter({ states: reporter?.states ?? defaultReporterStates })]

  // Drain the final stage so the pipeline waits for every publish, even without a reporter.
  const drain = new Writable({
    objectMode: true,
    write(_file, _encoding, callback) {
      callback()
    },
  })

  await pipeline([source, rewriteKey, publish, ...reporters, drain])
}
