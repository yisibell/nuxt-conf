/** Supported Sentry release formats. */
export type SentryReleaseMode = 'cdn-version' | 'sentry-release'

/** Formats a build timestamp as a UTC date in `YYYY.MM.DD` form. */
export const formatSentryReleaseDate = (timestamp: number) => {
  const date = new Date(timestamp)

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('.')
}

/**
 * Creates the Sentry release identifier for a build.
 *
 * @param mode Release format to use.
 * @param options Release generation options.
 * @param options.cdnVersion Resolved CDN version.
 * @param options.projectName Project identifier used in generated releases.
 * @param options.timestamp Build timestamp in milliseconds.
 * @returns The configured CDN version or a generated project release.
 */
export const createSentryRelease = (
  mode: SentryReleaseMode,
  {
    cdnVersion,
    projectName,
    timestamp,
  }: {
    cdnVersion: string
    projectName: string
    timestamp: number
  },
) => {
  if (mode === 'cdn-version') {
    return cdnVersion
  }

  return `${projectName}@${formatSentryReleaseDate(timestamp)}+${timestamp}`
}
