import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { hash } from 'ohash'
import { joinURL, withTrailingSlash } from 'ufo'
import type { NuxtConfConfigObject } from '../types'

const createCdnVersion = (
  rootDir: string,
  createVersionFile: boolean,
  versionFileName: string,
) => {
  const version = hash({ date: +new Date() }).toLowerCase().slice(0, 10)

  if (createVersionFile) {
    writeFileSync(
      resolve(rootDir, versionFileName),
      JSON.stringify({ version }),
    )
  }

  return version
}

export const resolveCdnUrl = (
  config: NuxtConfConfigObject,
  rootDir: string,
  writeVersionFile?: boolean,
  versionFileName = 'version.json',
) => {
  const baseUrl = config.NUXT_APP_CDN_BASE_URL

  const version = config.NUXT_APP_CDN_VERSION || createCdnVersion(
    rootDir,
    writeVersionFile ?? true,
    versionFileName,
  )

  config.NUXT_APP_CDN_VERSION = version

  // Keep version generation independent from the CDN base URL so consumers can
  // still use the version for cache-busting in environments without a CDN.
  if (!baseUrl) {
    return config.NUXT_APP_CDN_URL
  }

  config.NUXT_APP_CDN_URL = withTrailingSlash(joinURL(baseUrl, version))

  return config.NUXT_APP_CDN_URL
}
