import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import awspublish from 'gulp-awspublish'
import { expect, it, vi } from 'vitest'
import { uploadToS3 } from '../src/runtime/upload/s3'

function observeSimulatedUpload() {
  const keys: string[] = []
  const requestS3 = vi.fn(() => {
    throw new Error('S3 requests are disabled in this test')
  })
  const create = awspublish.create
  const createPublisher = vi.spyOn(awspublish, 'create').mockImplementation((config) => {
    const publisher = create(config)
    publisher.client.headObject = requestS3
    publisher.client.putObject = requestS3

    const publish = publisher.publish.bind(publisher)
    publisher.publish = (headers: unknown, options: { simulate?: boolean }) => {
      expect(options).toMatchObject({ simulate: true })
      const stream = publish(headers, options)
      stream.on('data', (file: { s3: { path: string } }) => keys.push(file.s3.path))
      return stream
    }

    return publisher
  })

  return { createPublisher, keys, requestS3 }
}

it('uses the configured environment and version to build simulated S3 keys', async () => {
  const rootDir = mkdtempSync(join(tmpdir(), 'nuxt-conf-s3-'))
  const { createPublisher, keys, requestS3 } = observeSimulatedUpload()

  try {
    mkdirSync(join(rootDir, 'public', 'assets'), { recursive: true })
    writeFileSync(join(rootDir, 'public', 'index.html'), '<h1>Example</h1>')
    writeFileSync(join(rootDir, 'public', 'assets', 'app.js'), 'console.log("example")')
    writeFileSync(join(rootDir, 'version.json'), JSON.stringify({ version: 'build-42' }))
    const environments = {
      production: { enabled: true, region: 'eu-west-1', bucket: 'example-production' },
      staging: { enabled: true, region: 'us-east-1', bucket: 'example-staging' },
    }
    writeFileSync(join(rootDir, 'awspublish.config.cjs'), `module.exports = ${JSON.stringify(environments)}`)

    await uploadToS3({
      rootDir,
      sourceDir: 'public',
      environment: 'staging',
      keyPrefix: 'static/app',
      reporter: false,
      publish: { options: { simulate: true } },
    })

    expect(createPublisher).toHaveBeenCalledWith(expect.objectContaining({
      region: 'us-east-1',
      params: { Bucket: 'example-staging' },
    }))
    expect(keys.sort()).toEqual([
      'static/app/staging/build-42/assets/app.js',
      'static/app/staging/build-42/index.html',
    ])
    expect(requestS3).not.toHaveBeenCalled()
  }
  finally {
    createPublisher.mockRestore()
    rmSync(rootDir, { recursive: true, force: true })
  }
})

it('uses explicit S3 settings and a key prefix without configuration files', async () => {
  const sourceDir = mkdtempSync(join(tmpdir(), 'nuxt-conf-s3-direct-'))
  const { createPublisher, keys, requestS3 } = observeSimulatedUpload()

  try {
    mkdirSync(join(sourceDir, 'assets'))
    writeFileSync(join(sourceDir, 'index.html'), '<h1>Example</h1>')
    writeFileSync(join(sourceDir, 'assets', 'app.js'), 'console.log("example")')

    await uploadToS3({
      sourceDir,
      region: 'eu-west-1',
      bucket: 'example-direct',
      keyPrefix: 'static/direct',
      reporter: false,
      publish: { options: { simulate: true } },
    })

    expect(createPublisher).toHaveBeenCalledWith(expect.objectContaining({
      region: 'eu-west-1',
      params: { Bucket: 'example-direct' },
    }))
    expect(keys.sort()).toEqual([
      'static/direct/assets/app.js',
      'static/direct/index.html',
    ])
    expect(requestS3).not.toHaveBeenCalled()
  }
  finally {
    createPublisher.mockRestore()
    rmSync(sourceDir, { recursive: true, force: true })
  }
})
