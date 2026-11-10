import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { hash } from 'ohash'
import { joinURL, withTrailingSlash } from 'ufo'
import type { NuxtConfConfigObject } from '../types'

export interface ResolvedCdn {
  version: string
  cdnUrl?: string
}

export const writeCdnVersionFile = (
  rootDir: string,
  version: string,
  versionFileName = 'version.json',
) => {
  writeFileSync(
    resolve(rootDir, versionFileName),
    JSON.stringify({ version }),
  )
}

export const createCdnVersion = (timestamp: number) => hash({ date: timestamp }).toLowerCase().slice(0, 10)

export const resolveCdnUrl = (
  config: NuxtConfConfigObject,
  generatedVersion: string,
): ResolvedCdn => {
  const baseUrl = config.NUXT_APP_CDN_BASE_URL
  const version = config.NUXT_APP_CDN_VERSION || generatedVersion

  // Keep version generation independent from the CDN base URL so consumers can
  // still use the version for cache-busting in environments without a CDN.
  if (!baseUrl) {
    return {
      version,
      cdnUrl: config.NUXT_APP_CDN_URL,
    }
  }

  return {
    version,
    cdnUrl: withTrailingSlash(joinURL(baseUrl, version)),
  }
}
