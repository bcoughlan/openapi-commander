const { Generator } = require('./generator')
const path = require('path')

describe('snapshots', () => {

  // This snapshot test is really just a way of making it easy for a developer to
  // see the diff of their changes in a way that can be easily code reviewed.
  it('generates petstore', async () => {
    const inputFile = path.join(__dirname, '../test-resources/petstore.yaml')
    const output = await Generator(inputFile, 'petStore').generate()
    expect(output).toMatchSnapshot()
  })

})