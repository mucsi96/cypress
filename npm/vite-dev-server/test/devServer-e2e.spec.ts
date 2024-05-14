import { expect } from 'chai'
import { EventEmitter } from 'events'
import http from 'http'
import { devServer } from '..'
import path from 'path'
import type { ConfigHandler } from '../src/devServer'

const requestSpecFile = (file: string, port: number) => {
  return new Promise((res) => {
    const opts = {
      host: '127.0.0.1',
      port,
      path: encodeURI(file),
    }

    const callback = (response: EventEmitter) => {
      let str = ''

      response.on('data', (chunk) => {
        str += chunk
      })

      response.on('end', () => {
        res(str)
      })
    }

    http.request(opts, callback).end()
  })
}

const root = path.join(__dirname, '..')

const viteConfig: ConfigHandler = {
  publicDir: root,
}

const createSpecs = (name: string): Cypress.Cypress['spec'][] => {
  return [
    {
      name: `${root}/test/fixtures/${name}`,
      relative: `${root}/test/fixtures/${name}`,
      absolute: `${root}/test/fixtures/${name}`,
    },
  ]
}

type DevServerCloseFn = Awaited<ReturnType<typeof devServer>>['close']

const closeServer = async (closeFn: DevServerCloseFn) => {
  await new Promise<void>((resolve, reject) => {
    closeFn((err?: Error) => {
      if (err) {
        return reject(err)
      }

      resolve()
    })
  })
}

const cypressConfig = {
  projectRoot: root,
  supportFile: '',
  isTextTerminal: true,
  devServerPublicPathRoute: root,
  cypressBinaryRoot: root,
  indexHtmlFile: 'test/component-index.html',
} as any as Cypress.PluginConfigOptions

describe('#devServer', () => {
  it('serves specs via a vite dev server', async () => {
    const { port, close } = await devServer({
      cypressConfig,
      viteConfig,
      specs: createSpecs('foo.spec.js'),
      devServerEvents: new EventEmitter(),
    })

    const response = await requestSpecFile('/test/fixtures/foo.spec.js', port as number)

    expect(response).to.eq('const foo = () => {}\n')

    await closeServer(close)
  })
})
.timeout(5000)
