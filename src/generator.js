const SwaggerParser = require('@apidevtools/swagger-parser')
const fs = require('fs/promises')
const path = require('path')
const { sanitizeCommand, sanitizeComment, sanitizeString, sanitizeVariable } = require('./sanitize')
const { groupEndpointsByFirstTag, getExamples, getTags } = require('./spec-utils')
const _ = require('lodash')

const globalFlags = new Set(['d', 'debug', 's', 'server'])

const reservedKeywords = [
  "break",  "case",  "catch",  "class",  "const",  "continue",  "debugger",  "default",  "delete",  "do",  "else", 
  "export",  "extends",  "finally",  "for",  "function",  "if",  "import",  "in",  "instanceof",  "new",  "return",
  "super",  "switch",  "this",  "throw",  "try",  "typeof",  "var",  "void",  "while",  "with",  "yield",
  "enum",  "implements",  "interface",  "let",  "package",  "private",  "protected",  "public",  "static",  "await"
]

//Generate Javascript variable names from any string that don't clash with other variable names
function UniqueVarGenerator(initial) {
  const used = new Set(initial) ?? new Set()

  return (name) => {
    name = sanitizeVariable(name)

    if (!used.has(name) && !reservedKeywords.includes(name)) {
      used.add(name)
      return name
    }

    for (let i = 1; ; i++) {
      if (!used.has(name + i)) {
        used.add(name + i)
        return name + i
      }
    }
  }
}

function Generator(specLocation) {

  const output = []
  function write(...args) { output.push(...args) }

  async function generate() {
    const api = await SwaggerParser.dereference(specLocation)

    write(await fs.readFile(path.join(__dirname, '../resources/header.js'), 'utf8'))
    write(`const defaultServer = '${sanitizeString(api.servers?.[0]?.url)}'\n\n`)

    const rootUniqueVars = new UniqueVarGenerator()
    const endpointsByTag = groupEndpointsByFirstTag(api)
    for (const tag of getTags(api, endpointsByTag)) {

      write(`/* ============== ${sanitizeComment(tag.name)} ============== */\n`)
      const cmdVar = rootUniqueVars(tag.name)
      write(`const ${cmdVar} = program.command('${cmdVar}')\n`)
      if (tag.description)
        write(`${cmdVar}.description('${sanitizeString(tag.description)}')\n\n`)

      for (const { parameters, path, method, operation } of endpointsByTag[tag.name]) {
        try {
          if (!operation.operationId) {
            operation.operationId = _.camelCase(`${method.toLowerCase()}_${path.replace(/\//g, '_')}`)
          }

          const examples = getExamples(operation)
          const commandName = rootUniqueVars(operation.operationId)

          const options = parameters.filter(p => !p.required || Object.prototype.hasOwnProperty.call(p, 'default'))
          const args = parameters.filter(p => p.required && !Object.prototype.hasOwnProperty.call(p, 'default'))

          const bodyLocation = !operation.requestBody ? null : (operation.requestBody.required) ? 'argument' : 'option'
          const defaultContentType = Object.keys(operation.requestBody?.content ?? {})?.[0]

          generateCommand(commandName, cmdVar, operation, examples)
          generateArguments(args)
          if (operation.requestBody) generateBody(operation.requestBody)
          generateOptions(options)
          generateAction(args, options, method, path, bodyLocation, defaultContentType)
        } catch (err) {
          //Add context for errors
          if (err.message) err.message = `Error processing ${method.toUpperCase()} ${path}: ${err.message}`
          throw err
        }
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

  function generateCommand(commandName, cmdVar, operation, examples) {
    write(`const ${commandName} = ${cmdVar}.command('${sanitizeCommand(operation.operationId)}')\n`)
    if (Object.keys(examples).length) {
      write(`${commandName}.command('examples').action(() => { printExamples(${JSON.stringify(examples)}) })\n`)
    }
    write(`${commandName}.description('${operation.deprecated ? '*DEPRECATED* ' : ''}${sanitizeString(operation.summary ?? operation.description)}')\n`)
  }

  function generateBody(requestBody) {
    if (requestBody.required) {
      write(`  .addArgument(new Argument('<body>', 'Path to a file containing the request body.'))\n`)
    } else {
      write(`  .addOption(new Option('--body <body>', 'Path to a file containing the request body.'))\n`)
    }

    const types = Object.keys(requestBody.content)
    if (types.length > 1) {
      write(`  .addOption(new Option('--body-type <bodyType>', 'Content type of the body file').choices(${JSON.stringify(types)}).default('${sanitizeString(types[0])}'))\n`)
    }
  }

  function generateAction(args, options, method, path, bodyLocation, defaultContentType) {
    const paramByType = { 'query': [], 'path': [], 'header': [], 'cookie': [] }
    for (const [i, arg] of args.entries()) {
      paramByType[arg.in].push({key: sanitizeString(arg.name), ref: `args[${i}]`})
    }
    for (const opt of options) {
      const sanitizedOpt = sanitizeString(opt.name)
      paramByType[opt.in].push({key: sanitizedOpt, ref: `opt['${sanitizedOpt}']`})
    }

    write(
      `  .action(async function(...args) {\n`,
    )

    if (bodyLocation || options.length > 0) {
      write(
        `    const opt = args[args.length - 2]\n`,
      )
    }

    write(`    const headers = {}\n`,)
    for (const {key, ref} of paramByType['header']) {
      write(`    if (${ref} !== undefined && ${ref} !== null) headers['${key}'] = ${ref}\n`)
    }


    write(`    const pathParams = {}\n`)
    for (const {key, ref} of paramByType['path']) {
      write(`    pathParams['${key}'] = ${ref}\n`)
    }

    write(`    const queryParams = {}\n`)
    for (const {key, ref} of paramByType['query']) {
      write(`    if (${ref} !== undefined && ${ref} !== null) queryParams['${key}'] = ${ref}\n`)
    }

    write(
      `    const globalOpts = getGlobalOptions()\n`,
      `    if (globalOpts.auth) headers.Authorization = globalOpts.auth\n\n`,
      `    const requestType = globalOpts.debug ? 'debug' : 'request'\n`,
      `    request('${sanitizeString(method)}', globalOpts.server ?? defaultServer, '${sanitizeString(path)}', {\n`,
      `      pathParams, queryParams, headers,\n`,
    )

    if (bodyLocation) {
      write(
        `      body: await fs.readFile(${bodyLocation === 'argument'? 'args[args.length - 3]' : "opt['body']"}, 'utf-8'),\n`,
        `      contentType: opt.bodyType || '${sanitizeString(defaultContentType)}'`,
      )
    }
    write(
      `    }, requestType)\n`,
      `  })\n\n`
    )
  }

  function generateArguments(args) {
    for (const argument of args) {
      const name = sanitizeString(argument.name)
      const description = sanitizeString(argument.description)
      write(`  .addArgument(new Argument('<${name}>', '${description}')`)
      if (argument.schema?.enum) {
        write(`.choices([${argument.schema.enum.map(e => `'${sanitizeString(e)}'`).join(', ')}])`)
      }
      write(')\n')
    }
  }

  function generateOptions(options) {
    const uniqueOptions = new UniqueVarGenerator(globalFlags)

    for (const option of options) {
      //TODO - --var1 and -v1 are not great user experience
      const name = uniqueOptions(option.name)
      const shortName = uniqueOptions(option.name[0])
      const description = sanitizeString(option.description)
      write(`  .addOption(new Option('-${shortName} --${name} <${name}>', '${description}')`)
      if (option.schema?.enum) {
        write(`.choices([${option.schema.enum.map(e => `'${sanitizeString(e)}'`).join(', ')}])`)
      }
      write(')\n')
    }
  }

  return { generate }
}

module.exports = { Generator }