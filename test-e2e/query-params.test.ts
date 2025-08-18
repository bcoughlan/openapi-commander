import { test, describe, before, after } from 'node:test'
import { strict as assert } from 'node:assert'
import { GeneratorTest } from './test-utils.ts'

describe('Query params', () => {

  let generatorTest

  before(async () => {
    generatorTest = await GeneratorTest('test-resources/query-params.yaml')
  })

  after(async () => {
    await generatorTest.cleanup()
  })

  test('arrays: explodes by default', async ( ) => {
    assert.ok((await generatorTest.run('test testArrayDefaults -p plain --types one,two')).stdout.includes('?types=one&types=two'))
  })

  test('arrays: respects explode:false', async () => {
    assert.ok((await generatorTest.run('test testExplodeFalse -p plain --types one,two')).stdout.includes('?types=one%2Ctwo'))
  })

})
