const path = require('node:path')
const util = require('node:util')
const fs = require('fs/promises')
const exec = util.promisify(require('node:child_process').exec)
const tmpPromise = require('tmp-promise')

async function GeneratorTest(inputFile, {defaultServer} = {}) {
  const {path: tmpPath, cleanup} = await tmpPromise.dir({ unsafeCleanup: true })
  const outputFile = path.join(tmpPath, path.basename(inputFile, '.yaml') + '.js')
  await exec(`node bin/run.js generate ${inputFile} ${outputFile}`)
  
  await fs.mkdir(path.join(tmpPath, 'node_modules'))
  await fs.cp(path.join(__dirname, '..', 'node_modules', 'commander'), path.join(tmpPath, 'node_modules', 'commander'), { recursive: true })

  async function run(cmd, { env = {}, server = defaultServer } = {}) {
    try {
      const nodePath = {NODE_PATH: path.join(__dirname, '..')}
      let { stdout, stderr } = await exec(`node ${outputFile} ${!server ? '' : `-s ${server}`} ${cmd} 2>&1`, { env: { ...process.env, ...env, ...nodePath } })
      return { stdout, stderr }
    } catch (e) {
      return { stdout: e.stdout, stderr: e.stderr, code: e.code }
    }
  }

  return {run, cleanup, tmpPath}
}

module.exports = { GeneratorTest }