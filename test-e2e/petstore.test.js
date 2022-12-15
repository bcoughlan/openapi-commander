const fs = require('fs/promises')
const path = require('path')
const express = require('express')
const { GeneratorTest } = require('./test-utils')

//TODO Use any free port for the server

const baseUrl = `http://localhost:3123`

describe('Petstore', () => {
  
  let generatorTest
  let server

  beforeAll(async () => {
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

  afterAll(async () => {
    server.close()
    await generatorTest.cleanup()
  })

  it('lists categories', async () => {
    expect(await generatorTest.run('')).toMatchSnapshot()
  })

  it('lists commands', async () => {
    expect(await generatorTest.run('pet')).toMatchSnapshot()
  })

  it('can do a GET', async () => {
    expect(await generatorTest.run('pet getPetById 1')).toMatchSnapshot()
  })

  it('debug prints', async () => {
    expect(await generatorTest.run('-p plain pet getPetById 10')).toMatchSnapshot()
  })

  it('prints a curl GET request', async () => {
    expect(await generatorTest.run('-p curl pet getPetById 10')).toMatchSnapshot()
  })

  it('prints a curl POST request', async () => {
    const bodyPath = path.join(generatorTest.tmpPath, 'post.json')
    await fs.writeFile(bodyPath, JSON.stringify({ id: 1, name: 'doggie' }))
    expect(await generatorTest.run(`-p curl  -a "Bearer mytoken" pet addPet ${bodyPath}`)).toMatchSnapshot()
  })

  it('prints examples', async () => {
    expect(await generatorTest.run('pet updatePet examples')).toMatchSnapshot()
  })

  it('prints --help on a PUT', async () => {
    expect(await generatorTest.run('pet updatePet --help')).toMatchSnapshot()
  })

  it('can do a PUT', async () => {
    await fs.writeFile('/tmp/pet.json', '{"id":10, "name":"test", "status":"available"}')
    expect(await generatorTest.run('pet updatePet /tmp/pet.json')).toMatchSnapshot()
  })

  it('sets exit code 1 if there is a non-2xx response', async () => {
    const { code } = await generatorTest.run('pet getPetById 3')
    expect(code).toEqual(1)
  })

  describe('auth header', () => {
    it('can set with option', async () => {
      const { stdout } = await generatorTest.run('pet getPetById 2 -a "test auth"')
      expect(stdout).toContain('"test auth"')
    })

    it('can set with env var', async () => {
      const { stdout } = await generatorTest.run('pet getPetById 2', { env: { 'PETSTORE_AUTH': 'test env auth' } })
      expect(stdout).toContain('"test env auth"')
    })

    it('gives precedence to option over env var', async () => {
      const { stdout } = await generatorTest.run('pet getPetById 2 -a "test auth"', { env: { 'PETSTORE_AUTH': 'test env auth' } })
      expect(stdout).toContain('"test auth"')
    })
  })

  describe('server', () => {
    it('can set with option', async () => {
      const { stdout } = await generatorTest.run('pet getPetById 1', { server: `${baseUrl}/customserver` })
      expect(stdout).toContain('"custom server worked"')
    })

    it('can set with env var', async () => {
      const { stdout } = await generatorTest.run('pet getPetById 1', { server: null, env: { 'PETSTORE_SERVER': `${baseUrl}/customserver` } })
      expect(stdout).toContain('"custom server worked"')
    })

    it('can set with env var', async () => {
      const { stdout } = await generatorTest.run('pet getPetById 1', { server: `${baseUrl}/customserver`, env: { 'PETSTORE_SERVER': `${baseUrl}/badpath` } })
      expect(stdout).toContain('"custom server worked"')
    })
  })

})
