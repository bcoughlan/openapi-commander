import { test, describe, before, after, snapshot } from 'node:test'
import { GeneratorTest } from './test-utils.ts'

snapshot.setResolveSnapshotPath(path => 'test-e2e/__snapshots__/petstore-swagger.snap')
const pretty = (str) => JSON.stringify(str, null, 2).replaceAll('\\n', '\n').replaceAll('\\"', '"')

// Convenience method for snapshot assertions
function matchSnapshot(t, value) {
  t.assert.snapshot(value, { serializers: [pretty] })
}

describe('Petstore Swagger 2', () => {
  
  let generatorTest 
  before(async () => {
    generatorTest = await GeneratorTest('test-resources/petstore-swagger.yaml')
  })

  after(async () => {
    await generatorTest.cleanup()
  })

  test('lists categories', async (t) => {
    matchSnapshot(t, await generatorTest.run(''))
  })

  test('lists commands', async (t) => {
    matchSnapshot(t, await generatorTest.run('pets'))
  })

  test('debug prints', async (t) => {
    matchSnapshot(t, await generatorTest.run('-p plain pets listPets'))
  })

})
