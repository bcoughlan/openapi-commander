
const fs = require('fs/promises')
const { Generator } = require('./generator')

const { Command, Argument } = require('commander')

const program = new Command()
program.command('generate')
  .addArgument(new Argument('<spec>', 'Path or URL of the OpenAPI 3 spec.'))
  .addArgument(new Argument('<outputFile>', 'Path of the output JS file.'))
  .action(async function(spec, outputFile) {
    const output = await Generator(spec).generate()
    await fs.writeFile(outputFile, output)
  })

program.parseAsync(process.argv)