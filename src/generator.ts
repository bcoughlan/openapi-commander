import fs from 'node:fs/promises'
import path from 'node:path'
import _ from 'lodash'
import { CLI } from './intermediate-model'
import { convertToIntermediate, } from './intermediate'
import { parseSpec } from './parse'
import { UniqueVarGenerator } from './utils'
import { sanitizeComment, sanitizeString, sanitizeVariable } from './sanitize'
import { OAS31Flat } from './oas31-types'

export function Generator(specLocation : string, cmdName : string) {

  const rootUniqueVars = UniqueVarGenerator()
  const output : string[] = []
  function write(...args : string[]) { output.push(...args) }

  async function generate() {
    const spec = await parseSpec(specLocation)
    const program = convertToIntermediate(spec, cmdName)

    write((await fs.readFile(path.join(__dirname, '../resources/header.js'), 'utf8'))
      .replace('COMMAND_NAME_TO_BE_REPLACED', sanitizeString(cmdName))
      .replace('COMMAND_NAME_ENV_VARS_TO_BE_REPLACED', sanitizeString(_.snakeCase(cmdName).toUpperCase())))
    write(`const defaultServer = '${program.defaultServer ? sanitizeString(program.defaultServer) : ''}'\n\n`)

    
    for (const rootCommand of program.commands) {
      if (rootCommand.type === 'group') {
        write(`/* ============== ${sanitizeComment(rootCommand.name)} ============== */\n`)
        const cmdVar = rootUniqueVars.get(sanitizeVariable(rootCommand.name))
        generateTagCommand(cmdVar, rootCommand.description ?? '')

        for (const command of rootCommand.subcommands) {
          generateCommand(command, cmdVar)
        }
      } else {
        generateCommand(rootCommand, 'program')
      }
    }

    write(
      `if (require.main === module) {\n`,
      `  program.parseAsync(process.argv)\n`,
      `} else {\n`,
      `  module.exports = program\n`,
      `}\n`
    )
    return output.join('')
  }

  /** Generate the full command */
  function generateCommand(command : CLI.Command, parentVarName: string) {
    try {
      const commandName = rootUniqueVars.get(sanitizeVariable(command.name))
      generateCommanderCommand(commandName, parentVarName, command)
      generatePositionalArguments(command.arguments)
      generateOptionArguments(command.arguments)
      generateAction(command.arguments, command.api)
    } catch (err) {
      //Add context for errors
      if (err instanceof Error)
        err.message = `Error processing command ${command.name} ${err.message}`
      throw err
    }
  }

  function generateTagCommand(cmdVar : string, tagDescription : string) {
    write(`const ${cmdVar} = program.command('${cmdVar}')\n`)
    if (tagDescription) {
      const summary = sanitizeString(tagDescription)
      const description = sanitizeString(tagDescription)
      if (summary !== description) {
        write(`  .summary('${summary}')\n`)
      }
      write(`  .description('${description}')\n\n`)
    }
  }

  function generateCommanderCommand(commandName : string, parentVarName : string, command : CLI.Command) { 
    if (Object.keys(command.examples).length) {
      write(`const ${commandName} = ${parentVarName}.command('${sanitizeString(command.name)}')\n`)
      write(`${commandName}.command('examples').action(() => { printExamples(${JSON.stringify(command.examples)}) })\n`)
      write(`${commandName}\n`)
    } else {
      write(`${parentVarName}.command('${sanitizeString(command.name)}')\n`)
    }

    const summary = sanitizeString(command.summary)
    const description = sanitizeString(command.description)
    if (summary !== description) {
      write(`  .summary('${summary}')\n`)
    }
    write(`  .description('${description}')\n`)
  }

  function generatePositionalArguments(args : CLI.Argument[]) {
    for (const arg of args) {
      if (arg.type === 'positional') {
        const name = sanitizeString(arg.name)
        const description = sanitizeString(arg.description)
        write(`  .addArgument(new Argument('<${name}>', '${description}')`)
        if (arg.choices) {
          write(`.choices([${arg.choices.map(e => `'${sanitizeString(e)}'`).join(', ')}])`)
        }
        write(')\n')
      }
    }
  }

  function generateOptionArguments(args : CLI.Argument[]) {
    for (const opt of args) {
      if (opt.type === 'option') {
        const description = sanitizeString(opt.description)
        const optKey = sanitizeString(`${opt.flag? `-${opt.flag}, ` : ''}--${opt.name} <${opt.valueName ?? opt.name}>`)

        if (opt.valueType === 'multi') {
          //Choices not enforced because I couldn't get argparser to work with choices()
          write(`  .addOption(new Option('${optKey}', '${description} ${opt.choices ?? ''}').argParser(v => v.split(',')))\n`)
        } else {
          write(`  .addOption(new Option('${optKey}', '${description}')`)
          if (opt.choices) {
            write(`.choices([${opt.choices.map(e => `'${sanitizeString(e)}'`).join(', ')}])`)
          }
          write(')\n')
        }
      }
    }
  }

  function generateAction(args : CLI.Argument[], api : CLI.ApiCall) {

    const refs = getCodeRefs(args)

    function parameters(paramIn : string) : [OAS31Flat.ParameterObject, RefArg][] {
      return refs.filter(e => e.mapping.type === 'parameter' && e.mapping.definition.in === paramIn)
              .map(e => [(e.mapping as CLI.ParameterMapping).definition, e])
    }

    const actionArgs = refs.filter(e => e.type === 'positional').map(e => e.ref)
    if (args.some(e => e.type === 'option')) {
      actionArgs.push('options')
    }
    write(`  .action(async function(${actionArgs.join(', ')}) {\n`)
    write(`    const req = emptyRequestParams()\n`)

    for (const [definition, { ref }] of parameters('path')) {
      write(`    req.pathParams['${definition.name}'] = ${ref}\n`)
    }

    for (const [definition, { ref }] of parameters('headers')) {
      write(`    req.headers['${definition.name}'] = ${ref}\n`)
    }

    for (const [definition, { ref }] of parameters('query')) {
      if (definition.schema?.type === 'array' && definition.explode !== false) {
        write(`    if (${ref}) ${ref}.forEach(p => req.queryParams.push(['${definition.name}', p]))\n`)
      } else {
        write(`    req.queryParams.push(['${definition.name}', ${ref}])\n`)
      }
    }

    const bodyArg = refs.find(e => e.mapping.type === 'requestBody')
    if (bodyArg) {
      const contentTypeArg = refs.find(e => e.mapping.type === 'contentType')
      const defaultContentType = sanitizeString((bodyArg.mapping as CLI.RequestBodyMapping).defaultContentType)

      write(
        `    if (${bodyArg.ref}) {\n`,
        `      req.body = await fs.readFile(${bodyArg.ref}, 'utf-8')\n`,
      )
      if (!contentTypeArg) {
        write(`      req.headers['Content-Type'] = '${defaultContentType}'\n`)
      } else if (!defaultContentType) {
        write(`      req.headers['Content-Type'] = ${contentTypeArg.ref}\n`)
      } else {
        write(`      req.headers['Content-Type'] = ${contentTypeArg.ref} || '${defaultContentType}'\n`)
      }
      write(`    }\n`)
    }

    write(
      `    await request('${sanitizeString(api.method)}', defaultServer, '${sanitizeString(api.path)}', req)\n`,
      `  })\n\n`
    )
  }

  type RefArg = CLI.Argument & { ref: string }

  /** Map arguments and options to variables and function parameters for the Commander action */
  function getCodeRefs(args: CLI.Argument[]) {
    const uniqueVars = UniqueVarGenerator()

    const refArgs : RefArg[] = []
    for (const arg of args) {
      if (arg.type === 'positional') {
        refArgs.push({...arg, ref: uniqueVars.get(arg.name)})
      } else {
        //Commander camel-cases option keys
        refArgs.push({...arg, ref: `options['${sanitizeString(_.camelCase(arg.name))}']`})
      }
    }

    return refArgs
  }

  return { generate }
}
