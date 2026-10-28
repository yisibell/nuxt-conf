import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import gulp from 'gulp'
import awspublish from 'gulp-awspublish'
import rename from 'gulp-rename'
import type {
  NuxtConfS3Config,
  NuxtConfUploadOptions,
  NuxtConfUploadState,
} from '../types'

type Publisher = ReturnType<typeof awspublish.create>

const defaultReporterStates: NuxtConfUploadState[] = [
  'create',
  'update',
  'put',
  'skip',
  'cache',
  'delete',
]

interface UploadBuildContext {
  rootDir: string
  environment: string
  upload: NuxtConfUploadOptions
  outputDir: string
  versionFileName: string
}

const loadConfigFile = async (rootDir: string, configFile: string, environment: string) => {
  // Keep deployment credentials in the project-provided config file rather than Nuxt runtime config.
  const configPath = resolve(rootDir, configFile)

  if (!existsSync(configPath)) {
    throw new Error(`S3 configuration file does not exist: ${configPath}`)
  }

  const imported = await import(pathToFileURL(configPath).href)
  const configs = imported.default ?? imported
  // Support both CommonJS module.exports and ESM export default config files.
  const config = configs[environment] as NuxtConfS3Config | undefined

  if (!config) {
    throw new Error(`Environment [${environment}] is missing from the S3 configuration file`)
  }

  return config
}

const loadVersion = (rootDir: string, versionFileName: string) => {
  // The CDN integration creates this file, so uploads use the exact same version as the CDN URL.
  const versionPath = resolve(rootDir, versionFileName)

  if (!existsSync(versionPath)) {
    throw new Error(`Version file does not exist: ${versionPath}`)
  }

  const version = JSON.parse(readFileSync(versionPath, 'utf8')).version

  if (!version || typeof version !== 'string') {
    throw new Error(`Version file does not contain a valid version: ${versionPath}`)
  }

  return version
}

const createPublisher = (config: NuxtConfS3Config): Publisher => {
  if (!config.region) {
    throw new Error('S3 region is not configured')
  }

  if (!config.bucket) {
    throw new Error('S3 bucket is not configured')
  }

  // Omit explicit credentials when they are not supplied so awspublish can use the AWS credential chain.
  const credentials = config.accessKeyId && config.secretAccessKey
    ? {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      }
    : undefined

  return awspublish.create({
    region: config.region,
    params: { Bucket: config.bucket },
    credentials,
  })
}

export async function uploadBuildOutput({
  rootDir,
  environment,
  upload,
  outputDir,
  versionFileName,
}: UploadBuildContext) {
  const config = await loadConfigFile(
    rootDir,
    upload.configFile ?? 'awspublish.config.cjs',
    environment,
  )

  if (!config.enabled) {
    return
  }

  const sourceDir = resolve(outputDir)
  const version = loadVersion(
    rootDir,
    versionFileName,
  )
  const publisher = createPublisher(config)
  const keyPrefix = upload.keyPrefix ?? 'nuxt/pc'
  const publishHeaders = {
    'Cache-Control': 'max-age=315360000, public',
    'x-amz-acl': 'public-read',
    ...upload.publish?.headers,
  }
  const publishOptions = {
    force: true,
    ...upload.publish?.options,
  }

  if (!existsSync(sourceDir)) {
    throw new Error(`Build output directory does not exist: ${sourceDir}`)
  }

  await new Promise<void>((resolveUpload, rejectUpload) => {
    // Rewrite each local file into a versioned, environment-specific S3 key.
    let uploadStream = gulp
      .src(join(sourceDir, '**/*'), {
        base: sourceDir,
        encoding: false,
      })
      .pipe(rename((filePath) => {
        filePath.dirname = `${keyPrefix}/${environment}/${version}/${filePath.dirname}`
      }))
      // Upload files through the existing awspublish pipeline without concurrency for now.
      .pipe(publisher.publish(publishHeaders, publishOptions))

    if (upload.reporter !== false) {
      uploadStream = uploadStream.pipe(awspublish.reporter({
        states: upload.reporter?.states ?? defaultReporterStates,
      }))
    }

    uploadStream
      .on('error', rejectUpload)
      .on('end', resolveUpload)
  })
}
