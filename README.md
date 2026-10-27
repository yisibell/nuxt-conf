# nuxt-conf

A Nuxt module for loading environment-specific TypeScript configuration and connecting it to Nuxt's configuration system.

Define configuration once in `config/env`, then let nuxt-conf expose it through `appConfig`, `runtimeConfig`, and selected Nuxt options.

## Features

- Loads `config/env/env.<environment>.ts`
- Selects the environment with `NUXT_APP_ENV`
- Falls back to the default environment when the selected file is missing
- Injects non-private values into `appConfig`
- Injects the complete configuration into the root `runtimeConfig` by default
- Generates versioned CDN URLs with `ohash` and `ufo`
- Writes `version.json` by default
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
    ├── env.development.ts
    ├── env.ft.ts
    └── env.production.ts
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

If the selected file is not found, the module tries the configured default environment. If no environment file exists, it emits a warning and skips configuration loading.

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

Generated file:

~~~json
{
  "version": "xxxxxxxxxx"
}
~~~

Customize or disable the version file:

~~~ts
export default defineNuxtConfig({
  modules: [
    ['nuxt-conf', {
      cdn: {
        writeVersionFile: false,
      },
    }],
  ],
})
~~~

~~~ts
export default defineNuxtConfig({
  modules: [
    ['nuxt-conf', {
      cdn: {
        versionFileName: 'public/build-version.json',
      },
    }],
  ],
})
~~~

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

~~~ts
interface NuxtConfModuleOptions {
  configDir?: string
  envVariable?: string
  defaultEnv?: string
  injectRuntimeConfig?: boolean
  cdn?: {
    enabled?: boolean
    writeVersionFile?: boolean
    versionFileName?: string
  }
  nuxtOptions?: Record<string, string | NuxtConfOptionMapping>
}
~~~

Defaults:

~~~ts
{
  configDir: 'config/env',
  envVariable: 'NUXT_APP_ENV',
  defaultEnv: 'development',
  injectRuntimeConfig: true,
  cdn: {
    enabled: true,
    writeVersionFile: true,
    versionFileName: 'version.json',
  },
  nuxtOptions: {},
}
~~~

## TypeScript types

The module automatically generates Nuxt type declarations from the active environment file and writes them to Nuxt's `.nuxt` types directory. Fields in the environment configuration therefore receive type hints in `useAppConfig()` and `useRuntimeConfig()` without requiring a duplicate `declare module` declaration in the consuming project.

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

Extend `NuxtConfConfigObject` for project-specific environment types:

~~~ts
import type { NuxtConfConfigObject, NuxtConfValue } from 'nuxt-conf'

export interface IEnvConfig extends NuxtConfConfigObject {
  NUXT_APP_ENV: 'development' | 'ft' | 'production'
  NUXT_APP_BASE_API: string

  private?: NuxtConfValue<{
    token: string
  }>
}
~~~

Use the type with the satisfies operator:

~~~ts
import type { IEnvConfig } from '../index'

export default {
  NUXT_APP_ENV: 'development',
  NUXT_APP_BASE_API: '/api',
  private: {
    private: true,
    token: 'server-only-token',
  },
} satisfies IEnvConfig
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
