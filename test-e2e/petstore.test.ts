import { test, describe, before, after, snapshot } from 'node:test'
import fs from 'node:fs/promises'
import path from 'node:path'
import { strict as assert } from 'node:assert'
import { GeneratorTest, } from './test-utils.ts'
import express from 'express'

snapshot.setResolveSnapshotPath(path => 'test-e2e/__snapshots__/petstore.snap')
const pretty = (str) => JSON.stringify(str, null, 2).replaceAll('\\n', '\n').replaceAll('\\"', '"')

// Convenience method for snapshot assertions
function matchSnapshot(t, value) {
  t.assert.snapshot(value, { serializers: [pretty] })
}

//TODO Use any free port for the server

const baseUrl = `http://localhost:3123`

describe('Petstore', () => {
  
  let generatorTest
  let server

  before(async () => {
    const app = express()
    app.use(express.json())
    app.get('/pet/1', (req, res) => {
      res.json({ id: 1, name: 'doggie' })
    })
    app.get('/pet/2', (req, res) => {
      res.json({ auth: req.headers['authorization'] })
    })
    app.get('/pet/3', (req, res) => {
      res.status(400).json({ message: 'bad request' })
    })
    app.get('/customserver/pet/1', (req, res) => {
      res.json({ msg: 'custom server worked' })
    })
    app.put('/pet', (req, res) => {
      res.json(req.body)
    })
    server = app.listen(3123)

    generatorTest = await GeneratorTest('test-resources/petstore.yaml', {defaultServer: baseUrl})
  })

  after(async () => {
    server.close()
    await generatorTest.cleanup()
  })

  test('lists categories', async (t) => {
    matchSnapshot(t, await generatorTest.run(''));
  })

  test('lists commands', async (t) => {
    matchSnapshot(t, await generatorTest.run('pet'));
  })

  test('can do a GET', async (t) => {
    matchSnapshot(t, await generatorTest.run('pet getPetById 1'));
  })

  test('debug prints', async (t) => {
    matchSnapshot(t, await generatorTest.run('-p plain pet getPetById 10'));
  })

  test('prints a curl GET request', async (t) => {
    matchSnapshot(t, await generatorTest.run('-p curl pet getPetById 10'));
  })

  test('prints a curl POST request', async (t) => {
    const bodyPath = path.join(generatorTest.tmpPath, 'post.json')
    await fs.writeFile(bodyPath, JSON.stringify({ id: 1, name: 'doggie' }))
    matchSnapshot(t, await generatorTest.run(`-p curl  -a "Bearer mytoken" pet addPet ${bodyPath}`))
  })

  test('prints examples', async (t) => {
    matchSnapshot(t, await generatorTest.run('pet updatePet examples'))
  })

  test('prints --help on a PUT', async (t) => {
    matchSnapshot(t, await generatorTest.run('pet updatePet --help'))
  })

  test('can do a PUT', async (t) => {
    await fs.writeFile('/tmp/pet.json', '{"id":10, "name":"test", "status":"available"}')
    matchSnapshot(t, await generatorTest.run('pet updatePet /tmp/pet.json'))
  })

  test('sets exit code 1 if there is a non-2xx response', async (t) => {
    const { code } = await generatorTest.run('pet getPetById 3')
    assert.equal(code, 1)
  })

  describe('auth header', () => {
    test('can set with option', async (t) => {
      const { stdout } = await generatorTest.run('pet getPetById 2 -a "test auth"')
      assert.ok(stdout.includes('"test auth"'))
    })

    test('can set with env var', async (t) => {
      const { stdout } = await generatorTest.run('pet getPetById 2', { env: { 'PETSTORE_AUTH': 'test env auth' } })
      assert.ok(stdout.includes('"test env auth"'))
    })

    test('gives precedence to option over env var', async (t) => {
      const { stdout } = await generatorTest.run('pet getPetById 2 -a "test auth"', { env: { 'PETSTORE_AUTH': 'test env auth' } })
      assert.ok(stdout.includes('"test auth"'))
    })
  })

  describe('server', () => {
    test('can set with option', async (t) => {
      const { stdout } = await generatorTest.run('pet getPetById 1', { server: `${baseUrl}/customserver` })
      assert.ok(stdout.includes('"custom server worked"'))
    })

    test('can set with env var', async (t) => {
      const { stdout } = await generatorTest.run('pet getPetById 1', { server: null, env: { 'PETSTORE_SERVER': `${baseUrl}/customserver` } })
      assert.ok(stdout.includes('"custom server worked"'))
    })

    test('can set with env var', async (t) => {
      const { stdout } = await generatorTest.run('pet getPetById 1', { server: `${baseUrl}/customserver`, env: { 'PETSTORE_SERVER': `${baseUrl}/badpath` } })
      assert.ok(stdout.includes('"custom server worked"'))
    })
  })

})
