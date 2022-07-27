const fs = require('fs/promises')
const express = require('express')
const { GeneratorTest } = require('./test-utils')

describe('Petstore Swagger 2', () => {
  
  let generatorTest
  beforeAll(async () => {
    generatorTest = await GeneratorTest('test-resources/petstore-swagger.yaml')
  })

  afterAll(async () => {
    await generatorTest.cleanup()
  })

  it('lists categories', async () => {
    expect(await generatorTest.run('')).toMatchSnapshot()
  })

  it('lists commands', async () => {
    expect(await generatorTest.run('pets')).toMatchSnapshot()
  })

  it('debug prints', async () => {
    expect(await generatorTest.run('-d pets listPets')).toMatchSnapshot()
  })

})
