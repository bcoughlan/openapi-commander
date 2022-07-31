const { GeneratorTest } = require('./test-utils')

describe('Query params', () => {

  let generatorTest

  beforeAll(async () => {
    generatorTest = await GeneratorTest('test-resources/query-params.yaml')
  })

  afterAll(async () => {
    await generatorTest.cleanup()
  })

  it('arrays: explodes by default', async () => {
    expect((await generatorTest.run('test testArrayDefaults -p plain --types one,two')).stdout).toContain('?types=one&types=two')
  })

  it('arrays: respects explode:false', async () => {
    expect((await generatorTest.run('test testExplodeFalse -p plain --types one,two')).stdout).toContain('?types=one%2Ctwo')
  })

})
