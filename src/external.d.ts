declare module 'gulp' {
  const gulp: {
    src(glob: string, options?: Record<string, any>): any
  }

  export default gulp
}

declare module 'gulp-awspublish' {
  const awspublish: {
    create(config: Record<string, any>): any
    reporter(options?: { states?: import('./types').NuxtConfUploadState[] }): any
  }

  export default awspublish
}

declare module 'gulp-rename' {
  export interface RenamePath {
    dirname: string
    basename: string
    extname: string
  }

  type Rename = (callback: (path: RenamePath) => void) => any

  const rename: Rename

  export default rename
}
