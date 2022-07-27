const { Generator } = require('./generator')
const path = require('path')

describe('snapshots', () => {

  it('generates successfully', async () => {
    const inputFile = path.join(__dirname, '../test-resources/petstore.yaml')
    const output = await Generator(inputFile, 'petStore').generate()
    expect(output).toContain('Everything about your Pets')
  })

})