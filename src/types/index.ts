/**
 * Base configuration shape consumed by nuxt-conf.
 *
 * The generic parameter allows each project to extend the shared CDN fields
 * with its own typed environment configuration.
 */
export type NuxtConfConfigObject<T extends object = Record<string, any>> = T & {
  /** Fully resolved CDN URL used by Nuxt for generated assets. */
  NUXT_APP_CDN_URL?: string
  /** Version segment used when building the resolved CDN URL. */
  NUXT_APP_CDN_VERSION?: string
  /** Base CDN URL used to generate NUXT_APP_CDN_URL. */
  NUXT_APP_CDN_BASE_URL?: string
} & Record<string, any>

/** Maps a value from the environment config to a Nuxt option path. */
export interface NuxtConfOptionMapping {
  /** Dot-notated source path in the loaded environment config. */
  from: string
  /** Whether the mapped value should replace an existing Nuxt option. */
  override?: boolean
}

/** Configuration loaded from awspublish.config.cjs for a selected environment. */
export interface NuxtConfS3Config {
  enabled?: boolean
  region?: string
  bucket?: string
  accessKeyId?: string
  secretAccessKey?: string
}

/** Options for publishing the Nuxt public build output to S3. */
export type NuxtConfUploadState = 'create' | 'update' | 'put' | 'skip' | 'cache' | 'delete'

export interface NuxtConfUploadReporterOptions {
  /** States printed by gulp-awspublish's reporter. */
  states?: NuxtConfUploadState[]
}

export interface NuxtConfUploadOptions {
  /** Enable the post-build upload. Defaults to false. */
  enabled?: boolean
  /** Project-relative awspublish configuration file. */
  configFile?: string
  /** Optional project-relative Nuxt build output directory override. */
  outputDir?: string
  /** Prefix used before the environment and version path. */
  keyPrefix?: string
  /** Configure per-file upload state output. Set to false to disable it. */
  reporter?: false | NuxtConfUploadReporterOptions
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
      /** Process files without sending write requests to S3. */
      simulate?: boolean
      /** Create missing objects but do not update existing objects. */
      createOnly?: boolean
    }
  }
}

/** A configuration object that can be marked as private at runtime. */
export type NuxtConfValue<T extends Record<string, any> = Record<string, any>> = T & {
  /** Marks the value as private while preserving its original object shape. */
  private?: boolean
}

export interface NuxtConfModuleOptions {
  /** Directory relative to the project root containing environment files. */
  configDir?: string
  /** Environment variable used to select the environment file. */
  envVariable?: string
  /** Environment loaded when the selector is missing or unsupported. */
  defaultEnv?: string
  /** Whether to inject the loaded configuration into Nuxt's runtimeConfig. Defaults to true. */
  injectRuntimeConfig?: boolean
  /** CDN processing is enabled automatically when NUXT_APP_CDN_BASE_URL is configured. */
  cdn?: {
    /** Explicitly enable or disable CDN URL processing. */
    enabled?: boolean
    /** Whether to write the generated version file. Defaults to true. */
    writeVersionFile?: boolean
    /** Version file name written to the project root. Defaults to version.json. */
    versionFileName?: string
  }
  upload?: NuxtConfUploadOptions
  /** Target nuxt.options path -> source config path. */
  nuxtOptions?: Record<string, string | NuxtConfOptionMapping>
}
