import { Generator } from './generator'
import { join } from 'node:path'

describe('snapshots', () => {

  it('generates successfully', async () => {
    const inputFile = join(__dirname, '../test-resources/petstore.yaml')
    const output = await Generator(inputFile, 'petStore').generate()
    expect(output).toContain('Everything about your Pets')
  })

})