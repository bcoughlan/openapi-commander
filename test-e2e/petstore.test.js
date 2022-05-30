const util = require('node:util')
const exec = util.promisify(require('node:child_process').exec)
const fs = require('fs/promises')
const express = require('express');

//TODO generate unique tmp dir.
//TODO Use any free port for the server

const baseUrl = `http://localhost:3123`

describe('Petstore', () => {

  let server
  beforeAll(async () => {
    const app = express()
    app.use(express.json())
    app.get('/pet/1', (req, res) => {
      res.json({ id: 1, name: 'doggie' })
    })
    app.put('/pet', (req, res) => {
      res.json(req.body)
    })
    server = app.listen(3123)

    await exec('node bin/run.js generate test-resources/petstore.yaml /tmp/petstore.js')
  })

  afterAll(async () => {
    server.close()
    await exec('rm -rf /tmp/petstore.js')
  })

  it('lists categories', async () => {
    expect(await run('')).toMatchSnapshot()
  })

  it('lists commands', async () => {
    expect(await run('pet')).toMatchSnapshot()
  })

  it('can do a GET', async () => {
    expect(await run('pet getPetById 1')).toMatchSnapshot()
  })

  it('debug prints', async () => {
    expect(await run('-d pet getPetById 10')).toMatchSnapshot()
  })

  it('prints examples', async () => {
    expect(await run('pet updatePet examples')).toMatchSnapshot()
  })

  it('prints --help on a PUT', async () => {
    expect(await run('pet updatePet --help')).toMatchSnapshot()
  })

  it('can do a PUT', async () => {
    await fs.writeFile('/tmp/pet.json', '{"id":10, "name":"test", "status":"available"}')
    expect(await run('pet updatePet /tmp/pet.json')).toMatchSnapshot()
  })

  async function run(cmd) {
    try {
      let { stdout, stderr } = await exec(`node petstore.js -s ${baseUrl} ${cmd} 2>&1`)
      //remove node experimental warnings as they are not deterministic
      stdout = stdout.replace(/\(node:\d+\) /, '')
      return { stdout, stderr }
    } catch (e) {
      return { stdout: e.stdout, stderr: e.stderr, code: e.code }
    }
  }
})
