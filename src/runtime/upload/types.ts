/** File states reported by gulp-awspublish. */
export type S3UploadState = 'create' | 'update' | 'put' | 'skip' | 'cache' | 'delete'

export interface S3UploadReporterOptions {
  /** States printed by gulp-awspublish's reporter. */
  states?: S3UploadState[]
}

/** Direct S3 upload settings for a local directory. */
export interface S3UploadOptions {
  /** Local directory to upload. Paths are relative to the current working directory. */
  sourceDir: string
  /** Name of the destination S3 bucket. */
  bucket: string
  /** AWS region of the destination bucket. */
  region: string
  /** Optional explicit credentials. Defaults to the AWS SDK credential chain. */
  credentials?: {
    accessKeyId: string
    secretAccessKey: string
    sessionToken?: string
  }
  /** Optional prefix before each file's relative S3 key. */
  keyPrefix?: string
  /** Maximum number of files processed at once. Must be a positive integer. Defaults to 10. */
  concurrency?: number
  /** Configure per-file upload state output. Set to false to disable it. */
  reporter?: false | S3UploadReporterOptions
  /** Arguments passed to gulp-awspublish's publisher.publish(headers, options). */
  publish?: {
    /** Additional S3 object headers applied to every uploaded file. */
    headers?: Record<string, string>
    /** Controls how files are compared and written to S3. */
    options?: {
      /** Upload the file even when its content matches the remote object. */
      force?: boolean
      /** Skip the remote HEAD check and write the object directly. */
      putOnly?: boolean
      /** Process files without sending any requests to S3. */
      simulate?: boolean
      /** Create missing objects but do not update existing objects. */
      createOnly?: boolean
    }
  }
}

/** Uploads using a named environment from an awspublish configuration file. */
export interface S3ConfiguredUploadOptions extends Omit<S3UploadOptions, 'region' | 'bucket' | 'credentials'> {
  /** Base directory for relative source and configuration paths. Defaults to the current working directory. */
  rootDir?: string
  /** Local directory to upload. Relative paths resolve from rootDir. */
  sourceDir: string
  /** Name of the entry to select from the awspublish configuration. */
  environment: string
  /** Path relative to rootDir. Defaults to awspublish.config.cjs. */
  configFile?: string
  /** Path relative to rootDir. Defaults to version.json. */
  versionFileName?: string
  /** Optional prefix before the environment and version in each S3 key. */
  keyPrefix?: string
}

/** Settings for one environment in an awspublish configuration file. */
export interface NuxtConfS3Config {
  /** Enables uploads for this environment. Defaults to false. */
  enabled?: boolean
  region?: string
  bucket?: string
  accessKeyId?: string
  secretAccessKey?: string
}
