import path from 'node:path'
import util from 'node:util'
import fs from 'node:fs/promises'
import { exec as execCallback } from 'node:child_process'

import tmpPromise from 'tmp-promise'

const exec = util.promisify(execCallback)

export async function GeneratorTest(inputFile, {defaultServer} = {}) {
  const {path: tmpPath, cleanup} = await tmpPromise.dir({ unsafeCleanup: true })
  const outputFile = path.join(tmpPath, path.basename(inputFile, '.yaml') + '.js')
  await exec(`node bin/run.js generate ${inputFile} ${outputFile}`)
  
  await fs.mkdir(path.join(tmpPath, 'node_modules'))
  await fs.cp(path.join(import.meta.dirname, '..', 'node_modules', 'commander'), path.join(tmpPath, 'node_modules', 'commander'), { recursive: true })

  async function run(cmd, { env = {}, server = defaultServer } = {}) {
    try {
      const nodePath = {NODE_PATH: path.join(import.meta.dirname, '..')}
      let { stdout, stderr } = await exec(`node ${outputFile} ${!server ? '' : `-s ${server}`} ${cmd} 2>&1`, { env: { ...process.env, ...env, ...nodePath } })
      return { stdout, stderr }
    } catch (e) {
      return { stdout: e.stdout, stderr: e.stderr, code: e.code }
    }
  }

  return {run, cleanup, tmpPath}
}
