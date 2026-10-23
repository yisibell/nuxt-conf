export default {
  NUXT_APP_ENV: 'development',
  NUXT_APP_BASE_API: '/api',
  NUXT_APP_CDN_BASE_URL: 'https://cdn.example.com/assets',
  proxy: {
    options: [
      {
        target: 'https://jsonplaceholder.typicode.com',
        pathRewrite: { '/api2': '' },
        pathFilter: ['/api2/**'],
      },
    ],
  },
}
