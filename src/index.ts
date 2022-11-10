
import fs from 'node:fs/promises'
import { Generator } from './generator'
import path from 'node:path'
import { Command, Argument } from 'commander'

const program = new Command()
program.command('generate')
  .addArgument(new Argument('<spec>', 'Path or URL of the OpenAPI 3 spec.'))
  .addArgument(new Argument('<outputFile>', 'Path of the output JS file.'))
  .action(async function(spec : string, outputFile : string) {
    const cmdName = path.basename(outputFile, path.extname(outputFile))
    const output = await Generator(spec, cmdName).generate()
    await fs.writeFile(outputFile, output)
  })

program.parseAsync(process.argv)