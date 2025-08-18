import { test, describe } from 'node:test'
import { strict as assert } from 'node:assert'
import { Generator } from './generator.ts'
import { join } from 'node:path'

describe('snapshots', () => {

  test('generates successfully', async () => {
    
    const inputFile = join(import.meta.dirname, '../test-resources/petstore.yaml')
    const output = await Generator(inputFile, 'petStore').generate()
    assert(output.includes('Everything about your Pets'))
  })

})