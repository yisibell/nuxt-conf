import type { NuxtConfEnvConfig } from './env.types'

export default {
  NUXT_APP_ENV: 'development',
  enumKey: process.env.ENUM_KEY as NuxtConfEnvConfig['enumKey'],
  proxy: {
    options: [
      {
        target: 'https://jsonplaceholder.typicode.com',
        pathRewrite: { '/api3': '' },
        pathFilter: ['/api3/**'],
      },
    ],
  },
} satisfies Partial<NuxtConfEnvConfig>
