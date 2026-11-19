# nuxt-conf

A Nuxt module for loading environment-specific TypeScript configuration and connecting it to Nuxt's configuration system.

Define configuration once in `config/env`, then let nuxt-conf expose it through `appConfig`, `runtimeConfig`, and selected Nuxt options.

## Features

- Loads and merges environment, default, and local configuration layers
- Selects the environment with `NUXT_APP_ENV`
- Falls back to the default environment when the selected file is missing
- Injects non-private values into `appConfig`
- Injects the complete configuration into the root `runtimeConfig` by default
- Generates versioned CDN URLs with `ohash` and `ufo`
- Writes build version metadata to `version.json` by default
- Supports configurable Sentry releases and can inject them into `sentry.release.name`
- Maps configuration values to Nuxt or other module options
- Supports project-specific TypeScript types
- Works as a standalone, publishable Nuxt module

## Installation

~~~bash
pnpm add nuxt-conf @nuxt/kit @nuxt/schema
~~~

### Compatibility and dependencies

This version supports Nuxt `>=3.16.0 <4.5`. Keep `nuxt`, `@nuxt/kit`, and `@nuxt/schema` on the same Nuxt release line and upgrade all three dependencies together.

`@nuxt/kit` and `@nuxt/schema` are peer dependencies of this module. Although they are usually installed with Nuxt, projects using strict dependency resolution such as pnpm should declare them explicitly to avoid module build or type resolution failures.

Register the module in `nuxt.config.ts`:

~~~ts
export default defineNuxtConfig({
  modules: [
    'nuxt-conf',
  ],
})
~~~

## Environment files

The default directory is `config/env`:

~~~text
config/
└── env/
    ├── env.default.ts
    ├── env.local.ts
    ├── env.production.default.ts
    ├── env.production.ts
    └── env.production.local.ts
~~~

A configuration file can export any object:

~~~ts
// config/env/env.development.ts
export default {
  NUXT_APP_ENV: 'development',
  NUXT_APP_BASE_API: '/api',
  NUXT_APP_CDN_BASE_URL: 'https://cdn.example.com/assets',

  private: {
    private: true,
    token: 'server-only-token',
  },
}
~~~

The active file is selected with `NUXT_APP_ENV`:

~~~bash
NUXT_APP_ENV=production pnpm build
~~~

For `NUXT_APP_ENV=production`, layers are merged with `defu` in this precedence order: `env.production.local.ts`, `env.local.ts`, `env.production.ts`, `env.production.default.ts`, then `env.default.ts`. Missing files are skipped. If the selected environment has no environment-specific files, the module merges the `defaultEnv` layers with the global layers. When the environment variable is unset, `defaultEnv` is selected directly. If no applicable files exist, the module emits a warning and skips configuration loading.

Layers are merged in the listed order, with each layer supplying defaults for the accumulated configuration:

- Higher priority values win when the values are scalars or of different types. Values such as `false`, `0`, and `''` count as set.
- When both values are plain objects, their properties are merged recursively.
- When both values are arrays, they are concatenated with the higher priority items first. For example, `['local']` and `['default']` become `['local', 'default']`.
- A missing, `null`, or `undefined` value can fall back to a value from a lower priority layer.

The merge helper is also available as `import { mergeEnvConfig } from 'nuxt-conf/core'` and applies the same merge rules to configuration objects keyed by their filename suffix, such as `production`, `production.local`, `production.default`, `local`, and `default`.

### Prefer a Node environment variable

In the playground, `env.development.ts` sets `enumKey` to `'bar'`. The higher priority `env.development.local.ts` reads `ENUM_KEY` from the Node process:

~~~ts
// playground/config/env/env.development.local.ts
import type { NuxtConfEnvConfig } from './env.types'

export default {
  enumKey: process.env.ENUM_KEY as NuxtConfEnvConfig['enumKey'],
} satisfies Partial<NuxtConfEnvConfig>
~~~

Set `ENUM_KEY=foo` when starting the playground or building it to use `'foo'`. Leave it unset and `defu` will fill in `'bar'` from `env.development.ts`. An empty string still takes precedence. The type assertion does not validate the environment variable at runtime.

## Configuration output

Non-private values are available through `useAppConfig`:

~~~ts
const appConfig = useAppConfig()

appConfig.NUXT_APP_ENV
appConfig.NUXT_APP_BASE_API
appConfig.NUXT_APP_CDN_URL
~~~

When `injectRuntimeConfig` is `true` (the default), the complete configuration is merged into the root `runtimeConfig`:

~~~ts
const runtimeConfig = useRuntimeConfig()

runtimeConfig.NUXT_APP_ENV
runtimeConfig.NUXT_APP_BASE_API
runtimeConfig.private
~~~

Disable this injection when the environment configuration should only be exposed through `appConfig` or used for Nuxt option mappings:

~~~ts
export default defineNuxtConfig({
  modules: [
    ['nuxt-conf', {
      injectRuntimeConfig: false,
    }],
  ],
})
~~~

A top-level object with `private: true` is excluded from `appConfig`, but remains in the root `runtimeConfig` when runtimeConfig injection is enabled. It is not moved under `runtimeConfig.public`.

## CDN handling

When `NUXT_APP_CDN_BASE_URL` is present, the module creates a versioned CDN URL:

~~~ts
NUXT_APP_CDN_BASE_URL = 'https://cdn.example.com/assets'
NUXT_APP_CDN_URL = 'https://cdn.example.com/assets/<version>/'
~~~

The version is generated with `ohash` and truncated to 10 characters. The resolved URL is also assigned to Nuxt's `app.cdnURL`.

By default, the module writes the generated version to `version.json`.

Set `writeConfigToVersionFile: true` to include the resolved configuration under the `config` field. By default, top-level entries marked with `private: true` are omitted. Set `writePrivateConfigToVersionFile: true` to include those entries as well.

Generated file:

~~~json
{
  "version": "xxxxxxxxxx",
  "sentryRelease": "project@2026.11.11+1794380256187"
}
~~~

`sentryRelease` is included when `injectSentryRelease` is enabled.

The generated version file can also be loaded through the public API. The function returns the complete parsed object and is intended for Node.js, server-side, or build-time use:

~~~ts
import { loadVersionFile } from 'nuxt-conf/version'

const versionFile = loadVersionFile('version.json', {
  rootDir: process.cwd(),
})

versionFile.version
versionFile.sentryRelease
~~~

To read only the stored `config` object, use `loadConfigSnapshot`. It returns `{}` if the version file cannot be read or parsed, or if it does not contain a valid `version` and `config` object.

Pass the expected config type as a generic argument to get typed fields. The result is `Partial<T>` because fields may be missing. The type argument does not validate field values at runtime.

~~~ts
import { loadConfigSnapshot } from 'nuxt-conf/version'

const config = loadConfigSnapshot<{ enumKey: 'foo' | 'bar' }>('version.json', {
  rootDir: process.cwd(),
})
~~~

To read only `sentryRelease`, use `loadSentryRelease`. It returns `undefined` if the version file cannot be loaded or the field is missing or is not a string.

~~~ts
import { loadSentryRelease } from 'nuxt-conf/version'

const sentryRelease = loadSentryRelease('version.json', {
  rootDir: process.cwd(),
})
~~~

Customize or disable the version file:

~~~ts
export default defineNuxtConfig({
  modules: [
    ['nuxt-conf', {
      writeVersionFile: false,
    }],
  ],
})
~~~

~~~ts
export default defineNuxtConfig({
  modules: [
    ['nuxt-conf', {
      versionFileName: 'public/build-version.json',
    }],
  ],
})
~~~

When `NUXT_APP_CDN_VERSION` is provided by the selected environment configuration, the module reuses that version and still writes it to `version.json` when `writeVersionFile` is enabled.

To inject the resolved CDN version into the Sentry Nuxt module configuration, enable `injectSentryRelease`:

~~~ts
export default defineNuxtConfig({
  modules: [
    [
      'nuxt-conf',
      {
        injectSentryRelease: true,
      },
    ],
  ],
})
~~~

When enabled, this sets `nuxt.options.sentry.release.name` to the resolved CDN version. It overwrites the value at the configured target path. The option defaults to `false`.

The release source can be selected with `sentryReleaseMode`:

- `sentry-release` (default): generates `project@YYYY.MM.DD+timestamp` using the build timestamp.
- `cdn-version`: uses the resolved CDN version.

For `sentry-release`, the project name is read from `package.json` by default and can be overridden with `sentryReleaseProject`.

The generated release is exposed as `NUXT_APP_SENTRY_RELEASE` through `useAppConfig()` and `useRuntimeConfig()`, and is also written to `version.json` as `sentryRelease`. The target option path can be customized with `sentryReleasePath`; it defaults to `sentry.release.name`.

Disable CDN processing completely:

~~~ts
export default defineNuxtConfig({
  modules: [
    ['nuxt-conf', {
      cdn: {
        enabled: false,
      },
    }],
  ],
})
~~~

Disabling CDN processing only prevents CDN URL injection. The build version and `version.json` generation remain enabled, so `sentryRelease` can still be written when `injectSentryRelease` is enabled.

When S3 upload is enabled, `writeVersionFile` must remain enabled because the upload process reads the generated version file.

## S3 static asset upload

`nuxt-conf` can upload the generated `.output/public` files to S3 after a production build. The feature is disabled by default and reads the selected environment from a project-level `awspublish.config.cjs`, matching the configuration format used by `gulp-awspublish`.

~~~ts
export default defineNuxtConfig({
  modules: [
    ['nuxt-conf', {
      upload: {
        enabled: true,
        configFile: 'awspublish.config.cjs',
        keyPrefix: 'nuxt/pc',
        reporter: {
          states: ['create', 'update', 'put'],
        },
        publish: {
          headers: {
            'Cache-Control': 'max-age=315360000, public',
            'x-amz-acl': 'public-read',
          },
          options: {
            force: true,
          },
        },
      },
    }],
  ],
})
~~~

The upload directory defaults to Nitro's `output.publicDir` (normally `.output/public`). Set `outputDir` only when a project uses a custom output directory. A Nuxt Loading indicator is shown while the S3 upload is running and is replaced by a success or failure message when it finishes.

The reporter prints all upload states by default. Use `reporter.states` to select specific states, or set `reporter: false` to disable per-file output while keeping the overall upload Loading indicator.

The configuration file uses one entry per environment:

~~~js
module.exports = {
  p: {
    enabled: true,
    region: 'us-east-1',
    bucket: 'example-bucket',
    accessKeyId: '...',
    secretAccessKey: '...',
  },
}
~~~

With `NUXT_APP_ENV=p`, files are uploaded to `nuxt/pc/p/<version>/...`. The version is read from the generated version file. Uploading runs from Nuxt's `build:done` hook and is skipped during development. The current implementation preserves the existing `gulp-awspublish` behavior, including `public-read`, long-lived caching, and forced upload. `writeVersionFile` must remain enabled when S3 upload is enabled.

## Nuxt option mapping

Use `nuxtOptions` to map values from the environment configuration to Nuxt options or options owned by another module:

~~~ts
export default defineNuxtConfig({
  modules: [
    ['nuxt-conf', {
      nuxtOptions: {
        proxy: 'proxy',
        multiCache: 'multiCache',
      },
    }],
  ],
})
~~~

The mapping key is the target path in `nuxt.options`, and the value is the source path in the loaded configuration.

Use the object form when the target should override an existing Nuxt option:

~~~ts
export default defineNuxtConfig({
  modules: [
    ['nuxt-conf', {
      nuxtOptions: {
        'proxy.options': {
          from: 'proxy.options',
          override: true,
        },
      },
    }],
  ],
})
~~~

Existing Nuxt values take precedence by default. Object values are merged with `defu` when both sides are plain objects.

## Module options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `configDir` | `string` | `'config/env'` | Directory containing environment files. |
| `envVariable` | `string` | `'NUXT_APP_ENV'` | Environment variable used to select the environment. |
| `defaultEnv` | `string` | `'development'` | Fallback environment when the selected environment is unavailable. |
| `injectRuntimeConfig` | `boolean` | `true` | Inject the loaded configuration into Nuxt `runtimeConfig`. |
| `injectSentryRelease` | `boolean` | `false` | Generate and inject a Sentry release into the configured Sentry release option path. |
| `sentryReleaseMode` | `'cdn-version' \| 'sentry-release'` | `'sentry-release'` | Select the CDN version or generated Sentry release format. |
| `sentryReleaseProject` | `string` | `package.json.name` | Project name used by the `sentry-release` mode. |
| `sentryReleasePath` | `string` | `'sentry.release.name'` | Nuxt option path that receives the generated Sentry release. |
| `cdn.enabled` | `boolean` | `true` | Enable or disable CDN URL processing. |
| `writeVersionFile` | `boolean` | `true` | Write the generated version file. |
| `writeConfigToVersionFile` | `boolean` | `false` | Include the resolved configuration under `config` in the version file. |
| `writePrivateConfigToVersionFile` | `boolean` | `false` | Include top-level `private: true` entries when configuration output is enabled. |
| `versionFileName` | `string` | `'version.json'` | Version file path relative to the project root. |
| `upload.enabled` | `boolean` | `false` | Upload static assets after a production build. |
| `upload.configFile` | `string` | `'awspublish.config.cjs'` | Project-relative S3 configuration file. |
| `upload.outputDir` | `string` | Nitro `output.publicDir` | Override the Nuxt public build output directory. |
| `upload.keyPrefix` | `string` | `'nuxt/pc'` | Prefix used in the generated S3 object key. |
| `upload.reporter` | `false \| object` | All states | Configure or disable per-file upload status output. |
| `upload.reporter.states` | `NuxtConfUploadState[]` | All states | States printed by the upload reporter. |
| `upload.publish.headers` | `Record<string, string>` | Built-in headers | Additional headers passed to `gulp-awspublish`. |
| `upload.publish.options` | `{ force?: boolean; putOnly?: boolean; simulate?: boolean; createOnly?: boolean }` | `{ force: true }` | Upload behavior options such as `simulate` and `createOnly`. |
| `nuxtOptions` | `Record<string, string \| NuxtConfOptionMapping>` | `{}` | Map environment values to Nuxt or module options. |

## TypeScript types

The module generates Nuxt declarations for `useAppConfig()` and `useRuntimeConfig()`. It looks for `env.types.ts` in the directory set by `conf.configDir`, which defaults to `config/env` relative to the Nuxt project root.

- If the file exists, export a named interface or type alias called `NuxtConfEnvConfig`. Its field types are used in the generated declarations, so a union such as `'foo' | 'bar'` is retained even if the active environment only sets `'foo'`.
- If the file is absent, the declarations use `NuxtConfMerge` from `nuxt-conf/core` to infer types from the loaded configuration layers.

The contract file is only used by TypeScript. Configuration values still come from merging the environment files with `defu`.
The filename `env.types.ts` is reserved for this contract. Projects that previously used `types` as an environment name should rename that environment and its files before upgrading.

Regenerate types:

~~~bash
pnpm nuxt prepare
~~~

The module exports the public types needed by consuming projects:

~~~ts
import type {
  NuxtConfConfigObject,
  NuxtConfModuleOptions,
  NuxtConfOptionMapping,
  NuxtConfValue,
} from 'nuxt-conf'
~~~

Define the contract in `config/env/env.types.ts` (or under your custom `conf.configDir`):

~~~ts
export interface NuxtConfEnvConfig {
  NUXT_APP_ENV: 'development' | 'ft' | 'production'
  NUXT_APP_BASE_API: string

  private?: {
    private: true
    token: string
  }
}
~~~

Keep this interface specific to your project. Declare the fields your project uses so TypeScript can catch misspelled keys.

Use `satisfies Partial<NuxtConfEnvConfig>` in each configuration layer to validate the fields it supplies. `Partial` only makes top-level fields optional:

~~~ts
import type { NuxtConfEnvConfig } from './env.types'

export default {
  NUXT_APP_ENV: 'development',
  NUXT_APP_BASE_API: '/api',
  private: {
    private: true,
    token: 'server-only-token',
  },
} satisfies Partial<NuxtConfEnvConfig>
~~~

## Playground

The repository includes a complete Playground that demonstrates:

- Environment file loading
- `appConfig` and `runtimeConfig`
- CDN URL and version generation
- Private configuration handling
- Nuxt option mapping

Run it with:

~~~bash
pnpm install
pnpm dev:prepare
pnpm dev
~~~

Build the Playground:

~~~bash
pnpm dev:build
~~~

## Development

Run the test suite:

~~~bash
pnpm test
~~~

Build the distributable module:

~~~bash
pnpm prepack
~~~

The published package contains the generated dist directory.
