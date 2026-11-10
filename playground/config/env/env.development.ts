import type { IEnvConfig } from '../index'

export default {
  NUXT_APP_ENV: 'development',
  NUXT_APP_BASE_API: '/api',
  proxy: {
    options: [
      {
        target: 'https://jsonplaceholder.typicode.com',
        pathRewrite: { '/api2': '' },
        pathFilter: ['/api2/**'],
      },
    ],
  },
  multiCache: {
    private: true,
    debug: true,
    routeCache: false,
  },

} satisfies IEnvConfig
